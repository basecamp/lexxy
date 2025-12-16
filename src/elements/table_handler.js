import { 
  $insertTableRowAtSelection,
  $deleteTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableColumnAtSelection,
  $findTableNode,
  $isTableCellNode,
  $isTableRowNode
} from "@lexical/table"
import { $getSelection, $isRangeSelection, $setSelection, $createRangeSelection } from "lexical"
import { createElement } from "../helpers/html_helper"

export class TableHandler extends HTMLElement {
  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor")
    this.editor = this.editorElement.editor

    this.#attachButtons()
    this.#monitorForTableSelection()
  }

  #attachButtons() {
    this.buttonsContainer = createElement("div", {
      className: "lexxy-table-handle-buttons"
    })

    this.rowButtonsContainer = this.#createRowButtonsContainer()
    this.buttonsContainer.appendChild(this.rowButtonsContainer)
    
    this.columnButtonsContainer = this.#createColumnButtonsContainer()
    this.buttonsContainer.appendChild(this.columnButtonsContainer)

    this.moreMenu = this.#createMoreMenu()
    this.buttonsContainer.appendChild(this.moreMenu)

    this.editorElement.appendChild(this.buttonsContainer)
  }

  #createRowButtonsContainer() {
    const container = this.#createContainer("Rows: ")

    const plusButton = this.#createButton("+", "Add row", this.#addRow)
    const minusButton = this.#createButton("−", "Remove row", this.#removeRow)

    container.appendChild(plusButton)
    container.appendChild(minusButton)

    return container
  }

  #createColumnButtonsContainer() {
    const container = this.#createContainer("Columns: ")

    const plusButton = this.#createButton("+", "Add column", this.#addColumn)
    const minusButton = this.#createButton("−", "Remove column", this.#removeColumn)

    container.appendChild(plusButton)
    container.appendChild(minusButton)

    return container
  }

  #createMoreMenu() {
    const container = createElement("details", {
      className: "lexxy-table-control lexxy-table-control__more-menu"
    })

    const summary = this.#createContainer("•••", "summary")
    container.appendChild(summary)

    const details = this.#createContainer("", "div", "lexxy-table-control__more-menu-details")

    const addRowButton = this.#createButton("+ Add row above", "Add row above", () => this.#addRow("above"))
    const addRowBelowButton = this.#createButton("+ Add row below", "Add row below", () => this.#addRow("below"))
    const addColumnButton = this.#createButton("+ Add column to the right", "Add column to the right", () => this.#addColumn("right"))
    const addColumnLeftButton = this.#createButton("+ Add column to the left", "Add column to the left", () => this.#addColumn("left"))
    const removeRowButton = this.#createButton("− Remove row", "Remove row", this.#removeRow)
    const removeColumnButton = this.#createButton("− Remove column", "Remove column", this.#removeColumn)

    details.appendChild(addRowButton)
    details.appendChild(addRowBelowButton)
    details.appendChild(addColumnButton)
    details.appendChild(addColumnLeftButton)
    details.appendChild(removeRowButton)
    details.appendChild(removeColumnButton)

    const deleteTableButton = this.#createDeleteTableButton()
    details.appendChild(deleteTableButton)

    container.appendChild(details)

    return container
  }

  #createDeleteTableButton() {
    return this.#createButton('<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 2C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4V4.188H4C3.73478 4.188 3.48043 4.29336 3.29289 4.48089C3.10536 4.66843 3 4.92278 3 5.188C3 5.45322 3.10536 5.70757 3.29289 5.89511C3.48043 6.08264 3.73478 6.188 4 6.188H18.875C19.1402 6.188 19.3946 6.08264 19.5821 5.89511C19.7696 5.70757 19.875 5.45322 19.875 5.188C19.875 4.92278 19.7696 4.66843 19.5821 4.48089C19.3946 4.29336 19.1402 4.188 18.875 4.188H15V4C15 3.46957 14.7893 2.96086 14.4142 2.58579C14.0391 2.21071 13.5304 2 13 2H10ZM4 7.313H18.875V19.188C18.875 19.9836 18.5589 20.7467 17.9963 21.3093C17.4337 21.8719 16.6706 22.188 15.875 22.188H7C6.20435 22.188 5.44129 21.8719 4.87868 21.3093C4.31607 20.7467 4 19.9836 4 19.188V7.313ZM13.563 10.563C13.8282 10.563 14.0826 10.6684 14.2701 10.8559C14.4576 11.0434 14.563 11.2978 14.563 11.563V16.875C14.563 17.1402 14.4576 17.3946 14.2701 17.5821C14.0826 17.7696 13.8282 17.875 13.563 17.875C13.2978 17.875 13.0434 17.7696 12.8559 17.5821C12.6684 17.3946 12.563 17.1402 12.563 16.875V11.562C12.563 11.2968 12.6684 11.0424 12.8559 10.8549C13.0434 10.6674 13.2978 10.563 13.563 10.563ZM10.313 11.563C10.313 11.2978 10.2076 11.0434 10.0201 10.8559C9.83257 10.6684 9.57822 10.563 9.313 10.563C9.04778 10.563 8.79343 10.6684 8.60589 10.8559C8.41836 11.0434 8.313 11.2978 8.313 11.563V16.875C8.313 17.1402 8.41836 17.3946 8.60589 17.5821C8.79343 17.7696 9.04778 17.875 9.313 17.875C9.57822 17.875 9.83257 17.7696 10.0201 17.5821C10.2076 17.3946 10.313 17.1402 10.313 16.875V11.563Z"/></svg> Delete table', "Delete table", this.#deleteTable)
  }

  #createContainer(label, type = "div", className = "lexxy-table-control") {
    const container = createElement(type, {
      className: className
    })

    container.textContent = label
    return container
  }

  #createButton(label, ariaLabel, onClick) {
    const button = createElement("button", {
      className: "lexxy-table-control__button",
      "aria-label": ariaLabel,
      type: "button"
    })
    button.innerHTML = label
    button.addEventListener("click", onClick.bind(this))
  
    return button
  }

  #addRow(direction = "below") {
    this.editor.update(() => {
      if (!direction) {
        this.#moveSelectionToLastRow()
      }
      $insertTableRowAtSelection(direction === "below")
    })
  }

  #removeRow() {
    this.editor.update(() => {
      this.#moveSelectionToLastRow()
      $deleteTableRowAtSelection()
    })
  }

  #addColumn(direction = "right") {
    this.editor.update(() => {
      if (!direction) {
        this.#moveSelectionToLastColumn()
      }
      $insertTableColumnAtSelection(direction === "right")
    })
  }

  #removeColumn() {
    this.editor.update(() => {
      this.#moveSelectionToLastColumn()
      $deleteTableColumnAtSelection()
    })
  }

  #deleteTable() {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const anchorNode = selection.anchor.getNode()
      const tableNode = $findTableNode(anchorNode)
      tableNode.remove()
    })
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

  #moveSelectionToLastColumn() {
    console.log("moveSelectionToLastColumn")
    // Get the table node from current selection to ensure we have the latest state
    const tableNode = this.#getCurrentTableNode()
    if (!tableNode) return

    const rows = tableNode.getChildren()
    
    // Find the first row to get column count
    let firstRow = null
    for (let i = 0; i < rows.length; i++) {
      if ($isTableRowNode(rows[i])) {
        firstRow = rows[i]
        break
      }
    }
    
    if (!firstRow) return
    
    // Get all cells in the first row to find the last column
    const cells = firstRow.getChildren().filter(cell => $isTableCellNode(cell))
    if (cells.length === 0) return
    
    // Get the last cell (rightmost column)
    const lastCell = cells[cells.length - 1]
    
    // Move selection to the last cell of the first row
    const selection = $createRangeSelection()
    const lastCellKey = lastCell.getKey()
    selection.anchor.set(lastCellKey, 0, "element")
    selection.focus.set(lastCellKey, 0, "element")
    $setSelection(selection)
  }

  #monitorForTableSelection() {
    this.editor.registerUpdateListener(() => {
      this.editor.getEditorState().read(() => {
        const tableNode = this.#getCurrentTableNode()

        if (tableNode) {
          this.#tableCellWasSelected(tableNode)
        } else {
          this.#hideButtons()
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
    return $findTableNode(anchorNode)
  }

  #tableCellWasSelected(tableNode) {
    this.currentTableNode = tableNode
    this.#updateButtonsPosition(tableNode)
    this.#showButtons()
  }

  #updateButtonsPosition(tableNode) {
    const tableElement = this.editor.getElementByKey(tableNode.getKey())
    if (!tableElement) return

    const tableRect = tableElement.getBoundingClientRect()
    const editorRect = this.editorElement.getBoundingClientRect()
    
    // Position row buttons at the bottom
    const relativeTop = tableRect.top - editorRect.top
    const relativeCenter = (tableRect.left + tableRect.right) / 2 - editorRect.left
    this.buttonsContainer.style.top = `${relativeTop}px`
    this.buttonsContainer.style.left = `${relativeCenter}px`
  }

  #showButtons() {
    this.buttonsContainer.style.display = "flex"
  }

  #hideButtons() {
    this.buttonsContainer.style.display = "none"
    this.moreMenu.removeAttribute("open")
    this.currentTableNode = null
  }
}

customElements.define("lexxy-table-handler", TableHandler)

