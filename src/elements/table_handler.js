import { 
  $insertTableRowAtSelection,
  $deleteTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableColumnAtSelection,
  $findTableNode,
  $getElementForTableNode,
  $getTableCellNodeFromLexicalNode,
  $isTableCellNode
} from "@lexical/table"
import { $getSelection, $isRangeSelection, $setSelection, $createRangeSelection } from "lexical"
import { createElement } from "../helpers/html_helper"

export class TableHandler extends HTMLElement {
  connectedCallback() {
    this.#attachButtons()
    this.#monitorForTableSelection()
  }

  get #editor() {
    return this.#editorElement.editor
  }

  get #editorElement() {
    return this.closest("lexxy-editor")
  }

  get #currentCell() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return null

    const anchorNode = selection.anchor.getNode()
    return $getTableCellNodeFromLexicalNode(anchorNode)
  }

  #attachButtons() {
    this.buttonsContainer = createElement("div", {
      className: "lexxy-table-handle-buttons"
    })

    this.rowButtonsContainer = this.#rowButtonsContainer()
    this.buttonsContainer.appendChild(this.rowButtonsContainer)
    
    this.columnButtonsContainer = this.#columnButtonsContainer()
    this.buttonsContainer.appendChild(this.columnButtonsContainer)

    this.moreMenu = this.#createMoreMenu()
    this.buttonsContainer.appendChild(this.moreMenu)

    this.#editorElement.appendChild(this.buttonsContainer)
  }

  #rowButtonsContainer() {
    const container = createElement("div", { className: "lexxy-table-control" })

    const plusButton = this.#createButton("+", "Add row", () => this.#insertTableRow("end"))
    const minusButton = this.#createButton("−", "Remove row", () => this.#deleteTableRow("end"))

    this.rowCount = createElement("span")
    this.rowCount.textContent = "_ rows"

    container.appendChild(minusButton)
    container.appendChild(this.rowCount)
    container.appendChild(plusButton)

    return container
  }

  #columnButtonsContainer() {
    const container = createElement("div", { className: "lexxy-table-control" })

    const plusButton = this.#createButton("+", "Add column", () => this.#insertTableColumn("end"))
    const minusButton = this.#createButton("−", "Remove column", () => this.#deleteTableColumn("end"))

    this.columnCount = createElement("span")
    this.columnCount.textContent = "_ columns"

    container.appendChild(minusButton)
    container.appendChild(this.columnCount)
    container.appendChild(plusButton)

    return container
  }

  #updateRowColumnCount() {
    if (!this.currentTableNode) return

    const tableElement = $getElementForTableNode(this.#editor, this.currentTableNode)
    if (!tableElement) return

    const rowCount = tableElement.rows
    const columnCount = tableElement.columns

    this.rowCount.textContent = `${rowCount} rows`
    this.columnCount.textContent = `${columnCount} columns`
  }

  #createMoreMenu() {
    const container = createElement("details", {
      className: "lexxy-table-control lexxy-table-control__more-menu"
    })

    const summary = createElement("summary", {}, "•••")
    container.appendChild(summary)

    const details = createElement("div", { className: "lexxy-table-control__more-menu-details" })

    const buttons = [
      { icon: "+", label: "Add row above", onClick: () => this.#insertTableRow("above") },
      { icon: "+", label: "Add row below", onClick: () => this.#insertTableRow("below") },
      { icon: "+", label: "Add column to the left", onClick: () => this.#insertTableColumn("left") },
      { icon: "+", label: "Add column to the right", onClick: () => this.#insertTableColumn("right") },
      { icon: "−", label: "Remove row", onClick: this.#deleteTableRow },
      { icon: "−", label: "Remove column", onClick: this.#deleteTableColumn },
      { icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.2129 19.2305C18.0925 20.7933 16.7892 22 15.2217 22H7.77832C6.21084 22 4.90753 20.7933 4.78711 19.2305L4 9H19L18.2129 19.2305Z"/><path d="M13 2C14.1046 2 15 2.89543 15 4H19C19.5523 4 20 4.44772 20 5V6C20 6.55228 19.5523 7 19 7H4C3.44772 7 3 6.55228 3 6V5C3 4.44772 3.44772 4 4 4H8C8 2.89543 8.89543 2 10 2H13Z"/></svg>', label: "Delete table", onClick: this.#deleteTable }
    ]

    buttons.forEach(button => {
      const buttonElement = this.#createButton(button.icon, button.label, button.onClick)
      details.appendChild(buttonElement)
    })

    container.appendChild(details)

    return container
  }

  #closeMoreMenu() {
    this.moreMenu.removeAttribute("open")
  }

  #createButton(icon, label, onClick) {
    const button = createElement("button", {
      className: "lexxy-table-control__button",
      "aria-label": label,
      type: "button"
    })
    button.innerHTML = `${icon} <span>${label}</span>`
    button.addEventListener("click", onClick.bind(this))
  
    return button
  }

  #insertTableRow(direction) {
    this.#manageTable("insert", "row", direction)
  }

  #insertTableColumn(direction) {
    this.#manageTable("insert", "column", direction)
  }

  #deleteTableRow(direction) {
    this.#manageTable("delete", "row", direction)
  }

  #deleteTableColumn(direction) {
    this.#manageTable("delete", "column", direction)
  }

  #manageTable(action = "insert", childType = "row", direction) {
    this.#editor.update(() => {
      const currentCell = this.#currentCell
      if (!currentCell) return

      if (direction === "end") {
        this.#selectLastTableCell()
      }

      switch (action) {
        case "insert":
          switch (childType) {
            case "row":
              $insertTableRowAtSelection(direction !== "above")
              break
            case "column":
              $insertTableColumnAtSelection(direction !== "left")
              break
          }
          break
        case "delete":
          switch (childType) {
            case "row":
              $deleteTableRowAtSelection()
              break
            case "column":
              $deleteTableColumnAtSelection()
              break
          }
      }
      
      if (currentCell.isAttached()) {
        currentCell.selectEnd()
      }
    })

    this.#closeMoreMenu()
    this.#updateRowColumnCount()
  }

  #deleteTable() {
    this.#editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const anchorNode = selection.anchor.getNode()
      const tableNode = $findTableNode(anchorNode)
      tableNode.remove()
    })

    this.#closeMoreMenu()
    this.#updateRowColumnCount()
  }

  #selectLastTableCell() {
    const tableNode = this.#getCurrentTableNode()
    if (!tableNode) return

    const last = tableNode.getLastChild().getLastChild()
    if (!$isTableCellNode(last)) return

    const lastCellKey = last.getKey()

    const selection = $createRangeSelection()
    selection.anchor.set(lastCellKey, 0, "element")
    selection.focus.set(lastCellKey, 0, "element")
    $setSelection(selection)
  }

  #monitorForTableSelection() {
    this.#editor.registerUpdateListener(() => {
      this.#editor.getEditorState().read(() => {
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
    const tableElement = this.#editor.getElementByKey(tableNode.getKey())
    if (!tableElement) return

    const tableRect = tableElement.getBoundingClientRect()
    const editorRect = this.#editorElement.getBoundingClientRect()
    
    // Position row buttons at the bottom
    const relativeTop = tableRect.top - editorRect.top
    const relativeCenter = (tableRect.left + tableRect.right) / 2 - editorRect.left
    this.buttonsContainer.style.top = `${relativeTop}px`
    this.buttonsContainer.style.left = `${relativeCenter}px`
  }

  #setTableFocusState(focused) {
    this.#editorElement.querySelector(".focused")?.classList.remove("focused")

    if (focused) {
      if (!this.currentTableNode) return

      const tableElement = this.#editor.getElementByKey(this.currentTableNode.getKey());
      if (!tableElement) return
      tableElement.classList.add("focused")
    }
  }

  #showButtons() {
    this.buttonsContainer.style.display = "flex"

    this.#updateRowColumnCount()
    this.#setTableFocusState(true)
  }

  #hideButtons() {
    this.buttonsContainer.style.display = "none"
    this.moreMenu.removeAttribute("open")
    
    this.#setTableFocusState(false)
    this.currentTableNode = null
  }
}

customElements.define("lexxy-table-handler", TableHandler)

