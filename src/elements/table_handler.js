import { 
  $insertTableRowAtSelection,
  $deleteTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableColumnAtSelection,
  $findTableNode,
  $getElementForTableNode,
  $getTableCellNodeFromLexicalNode,
  $getTableRowIndexFromTableCellNode,
  $getTableColumnIndexFromTableCellNode,
  $isTableCellNode,
  TableCellHeaderStates
} from "@lexical/table"
import { $getSelection, $isRangeSelection, $setSelection, $createRangeSelection } from "lexical"
import { createElement } from "../helpers/html_helper"

export class TableHandler extends HTMLElement {
  connectedCallback() {
    this.#setUpButtons()
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

  get #currentRow() {
    if (!this.#currentCell) return 0
    return $getTableRowIndexFromTableCellNode(this.#currentCell)
  }

  get #currentColumn() {
    if (!this.#currentCell) return 0
    return $getTableColumnIndexFromTableCellNode(this.#currentCell)
  }

  #setUpButtons() {
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

    this.rowCount.textContent = `${rowCount} row${rowCount === 1 ? "" : "s"}`
    this.columnCount.textContent = `${columnCount} column${columnCount === 1 ? "" : "s"}`
  }

  #createMoreMenu() {
    const container = createElement("details", {
      className: "lexxy-table-control lexxy-table-control__more-menu"
    })

    const summary = createElement("summary", {}, "•••")
    container.appendChild(summary)

    const details = createElement("div", { className: "lexxy-table-control__more-menu-details" })
    container.appendChild(details)

    const rowSection = this.#createRowSection()
    details.appendChild(rowSection)

    const columnSection = this.#createColumnSection()
    details.appendChild(columnSection)

    const deleteSection = this.#createDeleteSection()
    details.appendChild(deleteSection)

    return container
  }

  #createDeleteSection() {
    const deleteSection = createElement("section", { className: "lexxy-table-control__more-menu-section" })

    const deleteButton =
      { icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.2129 19.2305C18.0925 20.7933 16.7892 22 15.2217 22H7.77832C6.21084 22 4.90753 20.7933 4.78711 19.2305L4 9H19L18.2129 19.2305Z"/><path d="M13 2C14.1046 2 15 2.89543 15 4H19C19.5523 4 20 4.44772 20 5V6C20 6.55228 19.5523 7 19 7H4C3.44772 7 3 6.55228 3 6V5C3 4.44772 3.44772 4 4 4H8C8 2.89543 8.89543 2 10 2H13Z"/></svg>', label: "Delete table", onClick: this.#deleteTable }
    
    const buttonElement = this.#createButton(deleteButton.icon, deleteButton.label, deleteButton.onClick)
    deleteSection.appendChild(buttonElement)

    return deleteSection
  }

  #createColumnSection() {
    const columnSection = createElement("section", { className: "lexxy-table-control__more-menu-section" })

    const columnButtons = [
      { icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 21C1.89543 21 1 20.1046 1 19L1 5C1 3.89543 1.89543 3 3 3L5 3L5 21H3Z"/><path d="M9 5L6 0L12 2.62268e-07L9 5Z"/><path d="M11 23C11 23.5523 10.5523 24 10 24H8C7.44772 24 7 23.5523 7 23L7 8C7 7.44772 7.44772 7 8 7H10C10.5523 7 11 7.44772 11 8L11 23Z"/><path d="M13 21L13 3L17 3V21H13Z"/><path d="M23 19C23 20.1046 22.1046 21 21 21H19V3L21 3C22.1046 3 23 3.89543 23 5V19Z"/></svg>', label: "Add column before", onClick: () => this.#insertTableColumn("left") },
      { icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 21C22.1046 21 23 20.1046 23 19V5C23 3.89543 22.1046 3 21 3L19 3V21H21Z"/><path d="M15 5L18 0L12 2.62268e-07L15 5Z"/><path d="M13 23C13 23.5523 13.4477 24 14 24H16C16.5523 24 17 23.5523 17 23V8C17 7.44772 16.5523 7 16 7H14C13.4477 7 13 7.44772 13 8L13 23Z"/><path d="M11 21L11 3L7 3V21H11Z"/><path d="M1 19C1 20.1046 1.89543 21 3 21H5V3L3 3C1.89543 3 1 3.89543 1 5V19Z"/></svg>', label: "Add column after", onClick: () => this.#insertTableColumn("right") },
      { icon: "<svg></svg>", label: "Remove column", onClick: this.#deleteTableColumn },
      { icon: '<svg></svg>', label: "Toggle column style", onClick: this.#toggleColumnHeaderStyle },
    ]

    columnButtons.forEach(button => {
      const buttonElement = this.#createButton(button.icon, button.label, button.onClick)
      columnSection.appendChild(buttonElement)
    })

    return columnSection
  }

  #createRowSection() {
    const rowSection = createElement("section", { className: "lexxy-table-control__more-menu-section" })

    const rowButtons = [
      { icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 21C21 22.1046 20.1046 23 19 23H5C3.89543 23 3 22.1046 3 21V19H21V21Z"/><path d="M21 17H3V13H21V17Z"/><path d="M5 9L0 12V6L5 9Z"/><path d="M23 7C23.5523 7 24 7.44772 24 8V10C24 10.5523 23.5523 11 23 11H8C7.44772 11 7 10.5523 7 10V8C7 7.44772 7.44772 7 8 7H23Z"/><path d="M19 1C20.1046 1 21 1.89543 21 3V5H3V3C3 1.89543 3.89543 1 5 1H19Z"/></svg>', label: "Add row above", onClick: () => this.#insertTableRow("above") },
      { icon: '<svg viewBox="0 0 24 24"xmlns="http://www.w3.org/2000/svg"><path d="M21 21C21 22.1046 20.1046 23 19 23H5C3.89543 23 3 22.1046 3 21V19H21V21Z"/><path d="M5 15L0 18V12L5 15Z"/><path d="M23 13C23.5523 13 24 13.4477 24 14V16C24 16.5523 23.5523 17 23 17H8C7.44772 17 7 16.5523 7 16V14C7 13.4477 7.44772 13 8 13H23Z"/><path d="M21 11H3V7H21V11Z"/><path d="M19 1C20.1046 1 21 1.89543 21 3V5H3V3C3 1.89543 3.89543 1 5 1H19Z"/></svg>', label: "Add row below", onClick: () => this.#insertTableRow("below") },
      { icon: "<svg></svg>", label: "Remove row", onClick: this.#deleteTableRow },
      { icon: '<svg></svg>', label: "Toggle row style", onClick: this.#toggleRowHeaderStyle }
    ]

    rowButtons.forEach(button => {
      const buttonElement = this.#createButton(button.icon, button.label, button.onClick)
      rowSection.appendChild(buttonElement)
    })

    return rowSection
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

  #toggleRowHeaderStyle() {
    this.#editor.update(() => {
      const rows = this.currentTableNode.getChildren()

      const row = rows[this.#currentRow]
      if (!row) return

      const cells = row.getChildren()
      const firstCell = $getTableCellNodeFromLexicalNode(cells[0])
      if (!firstCell) return

      const currentStyle = firstCell.getHeaderStyles()
      const newStyle = currentStyle ^ TableCellHeaderStates.ROW

      cells.forEach(cell => {
        const tableCellNode = $getTableCellNodeFromLexicalNode(cell)
        
        if (tableCellNode) {
          tableCellNode.setHeaderStyles(newStyle, TableCellHeaderStates.ROW)
        }
      })
    })
  }

  #toggleColumnHeaderStyle() {
    this.#editor.update(() => {
      const rows = this.currentTableNode.getChildren()

      const row = rows[this.#currentRow]
      if (!row) return

      const cells = row.getChildren()
      const selectedCell = $getTableCellNodeFromLexicalNode(cells[this.#currentColumn])
      if (!selectedCell) return

      const currentStyle = selectedCell.getHeaderStyles()
      const newStyle = currentStyle ^ TableCellHeaderStates.COLUMN

      rows.forEach(row => {
        const cell = row.getChildren()[this.#currentColumn]
        if (!cell) return

        const tableCellNode = $getTableCellNodeFromLexicalNode(cell)
        
        if (tableCellNode) {
          tableCellNode.setHeaderStyles(newStyle, TableCellHeaderStates.COLUMN)
        }
      })
    })
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

  #selectLastTableCell() {
    const tableNode = this.#getCurrentTableNode()
    if (!tableNode) return

    const last = tableNode.getLastChild().getLastChild()
    if (!$isTableCellNode(last)) return

    last.selectEnd()
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
    this.#closeMoreMenu()

    this.#updateRowColumnCount()
    this.#setTableFocusState(true)
  }

  #hideButtons() {
    this.buttonsContainer.style.display = "none"
    this.#closeMoreMenu()
    
    this.#setTableFocusState(false)
    this.currentTableNode = null
  }
}

customElements.define("lexxy-table-handler", TableHandler)

