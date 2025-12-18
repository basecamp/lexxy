import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $findTableNode,
  $getElementForTableNode,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  TableCellHeaderStates
} from "@lexical/table"
import { $getSelection, $isRangeSelection } from "lexical"
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

  #icon(name) {
    const icons = 
      {
        "add-row-above":
        `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M4 7L0 10V4L4 7ZM6.5 7.5H16.5V6.5H6.5V7.5ZM18 8C18 8.55228 17.5523 9 17 9H6C5.44772 9 5 8.55228 5 8V6C5 5.44772 5.44772 5 6 5H17C17.5523 5 18 5.44772 18 6V8Z"/><path d="M2 2C2 1.44772 2.44772 1 3 1H15C15.5523 1 16 1.44772 16 2C16 2.55228 15.5523 3 15 3H3C2.44772 3 2 2.55228 2 2Z"/><path d="M2 12C2 11.4477 2.44772 11 3 11H15C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13H3C2.44772 13 2 12.5523 2 12Z"/><path d="M2 16C2 15.4477 2.44772 15 3 15H15C15.5523 15 16 15.4477 16 16C16 16.5523 15.5523 17 15 17H3C2.44772 17 2 16.5523 2 16Z"/></svg>`,

        "add-row-below":
        '<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M4 11L0 8V14L4 11ZM6.5 10.5H16.5V11.5H6.5V10.5ZM18 10C18 9.44772 17.5523 9 17 9H6C5.44772 9 5 9.44772 5 10V12C5 12.5523 5.44772 13 6 13H17C17.5523 13 18 12.5523 18 12V10Z"/><path d="M2 16C2 16.5523 2.44772 17 3 17H15C15.5523 17 16 16.5523 16 16C16 15.4477 15.5523 15 15 15H3C2.44772 15 2 15.4477 2 16Z"/><path d="M2 6C2 6.55228 2.44772 7 3 7H15C15.5523 7 16 6.55228 16 6C16 5.44772 15.5523 5 15 5H3C2.44772 5 2 5.44772 2 6Z"/><path d="M2 2C2 2.55228 2.44772 3 3 3H15C15.5523 3 16 2.55228 16 2C16 1.44772 15.5523 1 15 1H3C2.44772 1 2 1.44772 2 2Z"/></svg>',

        "remove-row":
        `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.9951 9.10254C17.9438 9.60667 17.5177 10 17 10H12.4922L13.9922 8.5H16.5V5.5L1.5 5.5L1.5 8.5H4.00586L5.50586 10H1L0.897461 9.99512C0.427034 9.94722 0.0527828 9.57297 0.00488281 9.10254L0 9L1.78814e-07 5C2.61831e-07 4.48232 0.393332 4.05621 0.897461 4.00488L1 4L17 4C17.5523 4 18 4.44772 18 5V9L17.9951 9.10254Z"/><path d="M11.2969 14.0146L8.99902 11.7168L6.7002 14.0146L5.63965 12.9541L7.93848 10.6562L5.63965 8.3584L6.7002 7.29785L8.99902 9.5957L11.2969 7.29785L12.3574 8.3584L10.0596 10.6563L12.3574 12.9541L11.2969 14.0146Z"/></svg>`,

        "toggle-row-style":
        `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"></svg>`,
      
        "add-column-before":
        '<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M7 4L10 2.62268e-07L4 0L7 4ZM7.5 6.5L7.5 16.5H6.5L6.5 6.5H7.5ZM8 18C8.55228 18 9 17.5523 9 17V6C9 5.44772 8.55229 5 8 5H6C5.44772 5 5 5.44772 5 6L5 17C5 17.5523 5.44772 18 6 18H8Z"/><path d="M2 2C1.44772 2 1 2.44772 1 3L1 15C1 15.5523 1.44772 16 2 16C2.55228 16 3 15.5523 3 15L3 3C3 2.44772 2.55229 2 2 2Z"/><path d="M12 2C11.4477 2 11 2.44772 11 3L11 15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15L13 3C13 2.44772 12.5523 2 12 2Z"/><path d="M16 2C15.4477 2 15 2.44772 15 3L15 15C15 15.5523 15.4477 16 16 16C16.5523 16 17 15.5523 17 15V3C17 2.44772 16.5523 2 16 2Z"/></svg>',
      
        "add-column-after":
        `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M11 4L8 2.62268e-07L14 0L11 4ZM10.5 6.5V16.5H11.5V6.5H10.5ZM10 18C9.44772 18 9 17.5523 9 17V6C9 5.44772 9.44772 5 10 5H12C12.5523 5 13 5.44772 13 6V17C13 17.5523 12.5523 18 12 18H10Z"/><path d="M16 2C16.5523 2 17 2.44772 17 3L17 15C17 15.5523 16.5523 16 16 16C15.4477 16 15 15.5523 15 15V3C15 2.44772 15.4477 2 16 2Z"/><path d="M6 2C6.55228 2 7 2.44772 7 3L7 15C7 15.5523 6.55228 16 6 16C5.44772 16 5 15.5523 5 15L5 3C5 2.44772 5.44771 2 6 2Z"/><path d="M2 2C2.55228 2 3 2.44772 3 3L3 15C3 15.5523 2.55228 16 2 16C1.44772 16 1 15.5523 1 15V3C1 2.44772 1.44771 2 2 2Z"/></svg>`,

        "remove-column":
        `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M9.10254 0.00488281C9.60667 0.0562145 10 0.482323 10 1V5.50781L8.5 4.00781V1.5H5.5V16.5H8.5V13.9941L10 12.4941V17L9.99512 17.1025C9.94722 17.573 9.57297 17.9472 9.10254 17.9951L9 18H5C4.48232 18 4.05621 17.6067 4.00488 17.1025L4 17V1C4 0.447715 4.44772 1.61064e-08 5 0H9L9.10254 0.00488281Z"/><path d="M11.7169 8.99999L14.015 11.2981L12.9543 12.3588L10.6562 10.0607L8.35815 12.3588L7.29749 11.2981L9.59559 8.99999L7.29749 6.7019L8.35815 5.64124L10.6562 7.93933L12.9543 5.64124L14.015 6.7019L11.7169 8.99999Z"/></svg>`,

        "toggle-column-style":
        `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"></svg>`,

        "delete-table":
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.2129 19.2305C18.0925 20.7933 16.7892 22 15.2217 22H7.77832C6.21084 22 4.90753 20.7933 4.78711 19.2305L4 9H19L18.2129 19.2305Z"/><path d="M13 2C14.1046 2 15 2.89543 15 4H19C19.5523 4 20 4.44772 20 5V6C20 6.55228 19.5523 7 19 7H4C3.44772 7 3 6.55228 3 6V5C3 4.44772 3.44772 4 4 4H8C8 2.89543 8.89543 2 10 2H13Z"/></svg>'
      }

    return icons[name]
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

    const deleteButton = { icon: this.#icon("delete-table"), label: "Delete table", onClick: this.#deleteTable }

    const buttonElement = this.#createButton(deleteButton.icon, deleteButton.label, deleteButton.onClick)
    deleteSection.appendChild(buttonElement)

    return deleteSection
  }

  #createColumnSection() {
    const columnSection = createElement("section", { className: "lexxy-table-control__more-menu-section" })

    const columnButtons = [
      { icon: this.#icon("add-column-before"), label: "Add column before", onClick: () => this.#insertTableColumn("left") },
      { icon: this.#icon("add-column-after"), label: "Add column after", onClick: () => this.#insertTableColumn("right") },
      { icon: this.#icon("remove-column"), label: "Remove column", onClick: this.#deleteTableColumn },
      { icon: this.#icon("toggle-column-style"), label: "Toggle column style", onClick: this.#toggleColumnHeaderStyle },
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
      { icon: this.#icon("add-row-above"), label: "Add row above", onClick: () => this.#insertTableRow("above") },
      { icon: this.#icon("add-row-below"), label: "Add row below", onClick: () => this.#insertTableRow("below") },
      { icon: this.#icon("remove-row"), label: "Remove row", onClick: this.#deleteTableRow },
      { icon: this.#icon("toggle-row-style"), label: "Toggle row style", onClick: this.#toggleRowHeaderStyle }
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

    const relativeTop = tableRect.top - editorRect.top
    const relativeCenter = (tableRect.left + tableRect.right) / 2 - editorRect.left
    this.buttonsContainer.style.top = `${relativeTop}px`
    this.buttonsContainer.style.left = `${relativeCenter}px`
  }

  #setTableFocusState(focused) {
    this.#editorElement.querySelector(".node--selected")?.classList.remove("node--selected")

    if (focused) {
      if (!this.currentTableNode) return

      const tableParent = this.#editor.getElementByKey(this.currentTableNode.getKey())
      if (!tableParent) return
      tableParent.classList.add("node--selected")
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

