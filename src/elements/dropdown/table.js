import { ToolbarDropdown } from "../toolbar_dropdown"
import { 
  $insertTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode
} from "@lexical/table"
import { $getSelection, $isRangeSelection, $setSelection, $createRangeSelection } from "lexical"
import { createElement } from "../../helpers/html_helper"

const DEFAULT_ROWS = 5
const DEFAULT_COLUMNS = 5

export class TableDropdown extends ToolbarDropdown {

  connectedCallback() {
    super.connectedCallback()

    this.#setUpButtons()
    this.#registerHandlers()
  }

  #setUpButtons() {
    this.#createTableButtons()
    this.#createEditButtons()
  }

  #createTableButtons() {
    const tableBlock = this.querySelector(".lexxy-editor__table-create .lexxy-editor__table-buttons")
    for (let i = 1; i <= DEFAULT_ROWS; i++) {
      const row = document.createElement("div")
      for (let j = 1; j <= DEFAULT_COLUMNS; j++) {
        const button = document.createElement("button")
        button.dataset.rows = i
        button.dataset.columns = j
        button.addEventListener("click", this.#insertTable.bind(this))
        this.#setupButtonHover(button)
        row.appendChild(button)
      }
      tableBlock.appendChild(row)
    }
  }

  #createEditButtons() {
    const tableBlock = this.querySelector(".lexxy-editor__table-edit .lexxy-editor__table-buttons")
    const buttons = [
      {
        label: "Insert a row before",
        command: "insertTableRowBefore",
        icon: ""
      },
      {
        label: "Insert a row after",
        command: "insertTableRowAfter",
        icon: ""
      },
      {
        label: "Insert a column before",
        command: "insertTableColumnBefore",
        icon: ""
      },
      {
        label: "Insert a column after",
        command: "insertTableColumnAfter",
        icon: ""
      },
      {
        label: "Delete row",
        command: "deleteTableRow",
        icon: ""
      },
      {
        label: "Delete column",
        command: "deleteTableColumn",
        icon: ""
      }
    ]
    buttons.forEach(button => {
      const btn = document.createElement("button")
      btn.textContent = button.label
      btn.dataset.command = button.command
      btn.addEventListener("click", this.#insertTable.bind(this))
      tableBlock.appendChild(btn)
    })
  }

  get #withHeaders() {
    return this.querySelector("input[type='checkbox']").checked
  }

  get #buttons() {
    return this.querySelectorAll("button")
  }

  get #activeButtons() {
    return this.querySelectorAll("button.active")
  }

  #buttonHover(btn) {
    const row = parseInt(btn.dataset.rows);
    const col = parseInt(btn.dataset.columns);
    
    this.#buttons.forEach(b => {
      const bRow = parseInt(b.dataset.rows);
      const bCol = parseInt(b.dataset.columns);
      
      if (bRow < row && bCol <= col || (bRow === row && bCol <= col)) {
        b.classList.add("active")
      }
    })
  }

  #setupButtonHover(btn) {
      btn.addEventListener("mouseenter", () => {
        this.#buttonHover(btn)
      })
      
      btn.addEventListener("mouseleave", () => {
        this.#activeButtons.forEach(b => 
          b.classList.remove("active")
        )
      })
  }

  #insertTable(event) {
    event.preventDefault()
    const rows = event.target.dataset.rows
    const columns = event.target.dataset.columns
    this.editor.dispatchCommand("insertTable", {
      rows: rows,
      columns: columns,
      includeHeaders: this.#withHeaders
    })
    this.close()
  }

  #registerHandlers() {
  }

}

customElements.define("lexxy-table-dropdown", TableDropdown)

export class TableHandle extends HTMLElement {
  #isDragging = false
  #dragStartY = null
  #lastRowDelta = 0
  #boundMouseMove = null
  #boundMouseUp = null

  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor")
    this.editor = this.editorElement.editor

    this.#attachHandle()
    this.#monitorForTableSelection()
  }

  #attachHandle() {
    this.handleElement = this.#createHandle()

    this.handleElement.style.position = "absolute"
    this.handleElement.style.cursor = "ns-resize"
    this.handleElement.style.display = "none"
    this.editorElement.appendChild(this.handleElement)

    this.#setupDragHandlers()
  }

  #createHandle() {
    const handle = createElement("div", {
      className: "lexxy-table-handle",
      "aria-label": "Resize table rows"
    })
    return handle
  }

  #setupDragHandlers() {
    this.handleElement.addEventListener("mousedown", (e) => {
      e.preventDefault()
      this.#isDragging = true
      this.#dragStartY = e.clientY
      this.#lastRowDelta = 0
      this.handleElement.style.userSelect = "none"
      
      this.#boundMouseMove = this.#onMouseMove.bind(this)
      this.#boundMouseUp = this.#onMouseUp.bind(this)
      
      document.addEventListener("mousemove", this.#boundMouseMove)
      document.addEventListener("mouseup", this.#boundMouseUp)
    })
  }

  #onMouseMove(e) {
    if (!this.#isDragging || !this.currentTableNode) return

    const currentY = e.clientY
    const startY = this.#dragStartY
    const totalDeltaY = currentY - startY
    
    // Calculate signed row delta: positive for down (add), negative for up (delete)
    const targetRowDelta = Math.floor(totalDeltaY / 40)
    
    // Only update if the row delta has changed
    if (targetRowDelta !== this.#lastRowDelta) {
      const deltaChange = targetRowDelta - this.#lastRowDelta
      
      this.editor.update(() => {
        // Move selection to last row before insert/delete operations
        this.#moveSelectionToLastRow()
        
        for (let i = 0; i < Math.abs(deltaChange); i++) {
          if (deltaChange > 0) {
            // Add row
            $insertTableRowAtSelection(true)
          } else {
            // Delete row
            $deleteTableRowAtSelection()
          }
        }
      })
      
      this.#lastRowDelta = targetRowDelta
    }
  }

  #moveSelectionToLastRow() {
    // Get the table node from current selection to ensure we have the latest state
    const tableNode = this.#getCurrentTableNode()
    if (!tableNode) return

    const rows = tableNode.getChildren()
    
    // Find the last row node
    let lastRow = null
    for (let i = rows.length - 1; i >= 0; i--) {
      if ($isTableRowNode(rows[i])) {
        lastRow = rows[i]
        break
      }
    }
    
    if (!lastRow) return
    
    // Get the first cell in the last row
    const cells = lastRow.getChildren()
    const firstCell = cells.find(cell => $isTableCellNode(cell))
    
    if (!firstCell) return
    
    // Move selection to the first cell of the last row
    const selection = $createRangeSelection()
    const firstCellKey = firstCell.getKey()
    selection.anchor.set(firstCellKey, 0, "element")
    selection.focus.set(firstCellKey, 0, "element")
    $setSelection(selection)
  }

  #onMouseUp() {
    this.#isDragging = false
    this.#dragStartY = null
    this.#lastRowDelta = 0
    this.handleElement.style.userSelect = ""
    if (this.#boundMouseMove) {
      document.removeEventListener("mousemove", this.#boundMouseMove)
    }
    if (this.#boundMouseUp) {
      document.removeEventListener("mouseup", this.#boundMouseUp)
    }
    this.#boundMouseMove = null
    this.#boundMouseUp = null
  }

  #monitorForTableSelection() {
    this.editor.registerUpdateListener(() => {
      this.editor.getEditorState().read(() => {
        const tableNode = this.#getCurrentTableNode()

        if (tableNode) {
          this.#tableCellWasSelected(tableNode)
        } else {
          this.#hideHandle()
        }
      })
    })
  }

  #getCurrentTableNode() {
    const selection = $getSelection()

    if (!$isRangeSelection(selection)) {
      return null
    }

    const anchorNode = selection.anchor.getNode()
    
    // Traverse up to find table cell or table node
    let current = anchorNode
    while (current !== null) {
      if ($isTableCellNode(current)) {
        // Find the table node from the cell
        let parent = current.getParent()
        while (parent !== null) {
          if ($isTableNode(parent)) {
            return parent
          }
          parent = parent.getParent()
        }
        return null
      }
      if ($isTableNode(current)) {
        return current
      }
      current = current.getParent()
    }

    return null
  }

  #tableCellWasSelected(tableNode) {
    this.currentTableNode = tableNode
    this.#updateHandlePosition(tableNode)
    this.#showHandle()
  }

  #updateHandlePosition(tableNode) {
    const tableElement = this.editor.getElementByKey(tableNode.getKey())
    if (!tableElement) return

    const tableRect = tableElement.getBoundingClientRect()
    const editorRect = this.editorElement.getBoundingClientRect()
    const relativeTop = tableRect.bottom - editorRect.top

    this.handleElement.style.top = `${relativeTop}px`
    this.handleElement.style.left = `${tableRect.left - editorRect.left}px`
    this.handleElement.style.width = `${tableRect.width}px`
  }

  #showHandle() {
    this.handleElement.style.display = "block"
  }

  #hideHandle() {
    this.handleElement.style.display = "none"
    this.currentTableNode = null
  }
}

customElements.define("lexxy-table-handle", TableHandle)

/*
  <button data-command="insertTable">Insert a table</button>
  <button data-command="insertTableRowAfter">Insert a row after</button>
  <button data-command="insertTableRowBefore">Insert a row before</button>
  <button data-command="insertTableColumnAfter">Insert a column after</button>
  <button data-command="insertTableColumnBefore">Insert a column before</button>
  <button data-command="deleteTableRow">Delete a row</button>
  <button data-command="deleteTableColumn">Delete a column</button>
*/