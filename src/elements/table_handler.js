import {
  $getSelection,
  $isRangeSelection,
} from "lexical"
import {
  $findTableNode,
  $getElementForTableNode,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  TableCellHeaderStates
} from "@lexical/table"

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

    this.buttonsContainer.appendChild(this.#createRowButtonsContainer())
    this.buttonsContainer.appendChild(this.#createColumnButtonsContainer())

    this.moreMenu = this.#createMoreMenu()
    this.buttonsContainer.appendChild(this.moreMenu)

    this.#editorElement.appendChild(this.buttonsContainer)
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

  #createRowButtonsContainer() {
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

  #createColumnButtonsContainer() {
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

  #createMoreMenu() {
    const container = createElement("details", {
      className: "lexxy-table-control lexxy-table-control__more-menu"
    })

    const summary = createElement("summary", {}, "•••")
    container.appendChild(summary)

    const details = createElement("div", { className: "lexxy-table-control__more-menu-details" })
    container.appendChild(details)

    details.appendChild(this.#createRowSection())
    details.appendChild(this.#createColumnSection())
    details.appendChild(this.#createDeleteTableSection())

    container.addEventListener("toggle", this.#handleMoreMenuToggle.bind(this))

    return container
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

  #createDeleteTableSection() {
    const deleteSection = createElement("section", { className: "lexxy-table-control__more-menu-section" })

    const deleteButton = { icon: this.#icon("delete-table"), label: "Delete table", onClick: this.#deleteTable }

    const buttonElement = this.#createButton(deleteButton.icon, deleteButton.label, deleteButton.onClick)
    deleteSection.appendChild(buttonElement)

    return deleteSection
  }

  #handleMoreMenuToggle() {
    this.#editor.getEditorState().read(() => {
      if (this.moreMenu.open) {
        this.#focusSelectedCell()
      } else {
        this.#blurSelectedCell()
      }
    })
  }

  #closeMoreMenu() {
    this.#blurSelectedCell()
    this.moreMenu.removeAttribute("open")
  }

  #focusSelectedCell() {
    if (!this.#currentCell) return

    const cellElement = this.#editor.getElementByKey(this.#currentCell.getKey())
    if (!cellElement) return

    cellElement.classList.add("table-cell--selected")
  }

  #blurSelectedCell() {
    this.#editorElement.querySelector(".table-cell--selected")?.classList.remove("table-cell--selected")
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

  #deleteTable() {
    this.#editor.dispatchCommand("deleteTable", undefined)

    this.#closeMoreMenu()
    this.#updateRowColumnCount()
  }

  #insertTableRow(direction) {
    this.#executeTableCommand("insert", "row", direction)
  }

  #insertTableColumn(direction) {
    this.#executeTableCommand("insert", "column", direction)
  }

  #deleteTableRow(direction) {
    this.#executeTableCommand("delete", "row", direction)
  }

  #deleteTableColumn(direction) {
    this.#executeTableCommand("delete", "column", direction)
  }

  #executeTableCommand(action = "insert", childType = "row", direction) {
    this.#editor.update(() => {
      const currentCell = this.#currentCell
      if (!currentCell) return

      if (direction === "end") {
        this.#selectLastTableCell()
      }

      this.#dispatchTableCommand(action, childType, direction)

      if (currentCell.isAttached()) {
        currentCell.selectEnd()
      }
    })

    this.#closeMoreMenu()
    this.#updateRowColumnCount()
  }

  #dispatchTableCommand(action, childType, direction) {
    switch (action) {
      case "insert":
        switch (childType) {
          case "row":
            if (direction === "above") {
              this.#editor.dispatchCommand("insertTableRowAbove", undefined)
            } else {
              this.#editor.dispatchCommand("insertTableRowBelow", undefined)
            }
            break
          case "column":
            if (direction === "left") {
              this.#editor.dispatchCommand("insertTableColumnBefore", undefined)
            } else {
              this.#editor.dispatchCommand("insertTableColumnAfter", undefined)
            }
            break
        }
        break
      case "delete":
        switch (childType) {
          case "row":
            this.#editor.dispatchCommand("deleteTableRow", undefined)
            break
          case "column":
            this.#editor.dispatchCommand("deleteTableColumn", undefined)
            break
        }
        break
    }
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
        this.#setHeaderStyle(cell, newStyle, TableCellHeaderStates.ROW)
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
        this.#setHeaderStyle(cell, newStyle, TableCellHeaderStates.COLUMN)
      })
    })
  }

  #setHeaderStyle(cell, newStyle, headerState) {
    const tableCellNode = $getTableCellNodeFromLexicalNode(cell)

    if (tableCellNode) {
      tableCellNode.setHeaderStyles(newStyle, headerState)
    }
  }

  #monitorForTableSelection() {
    this.#editor.registerUpdateListener(() => {
      this.#editor.getEditorState().read(() => {
        const tableNode = this.#getCurrentTableNode()

        if (tableNode) {
          this.#tableCellWasSelected(tableNode)
        } else {
          this.#hideTableHandlerButtons()
        }
      })
    })
  }

  #getCurrentTableNode() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return null

    const anchorNode = selection.anchor.getNode()
    return $findTableNode(anchorNode)
  }

  #selectLastTableCell() {
    const tableNode = this.#getCurrentTableNode()
    if (!tableNode) return

    const last = tableNode.getLastChild().getLastChild()
    if (!$isTableCellNode(last)) return
    console.log("selectLastTableCell")
    last.selectEnd()
  }

  #tableCellWasSelected(tableNode) {
    this.currentTableNode = tableNode
    this.#updateButtonsPosition(tableNode)
    this.#showTableHandlerButtons()
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
    this.#editorElement.querySelector("div.node--selected:has(table)")?.classList.remove("node--selected")

    if (focused && this.currentTableNode) {
      const tableParent = this.#editor.getElementByKey(this.currentTableNode.getKey())
      if (!tableParent) return
      tableParent.classList.add("node--selected")
    }
  }

  #showTableHandlerButtons() {
    this.buttonsContainer.style.display = "flex"
    this.#closeMoreMenu()

    this.#updateRowColumnCount()
    this.#setTableFocusState(true)
  }

  #hideTableHandlerButtons() {
    this.buttonsContainer.style.display = "none"
    this.#closeMoreMenu()

    this.#setTableFocusState(false)
    this.currentTableNode = null
  }

  #icon(name) {
    const icons =
      {
        "add-row-above":
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7L0 10V4L4 7ZM6.5 7.5H16.5V6.5H6.5V7.5ZM18 8C18 8.55228 17.5523 9 17 9H6C5.44772 9 5 8.55228 5 8V6C5 5.44772 5.44772 5 6 5H17C17.5523 5 18 5.44772 18 6V8Z"/><path d="M2 2C2 1.44772 2.44772 1 3 1H15C15.5523 1 16 1.44772 16 2C16 2.55228 15.5523 3 15 3H3C2.44772 3 2 2.55228 2 2Z"/><path d="M2 12C2 11.4477 2.44772 11 3 11H15C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13H3C2.44772 13 2 12.5523 2 12Z"/><path d="M2 16C2 15.4477 2.44772 15 3 15H15C15.5523 15 16 15.4477 16 16C16 16.5523 15.5523 17 15 17H3C2.44772 17 2 16.5523 2 16Z"/>
          </svg>`,

        "add-row-below":
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 11L0 8V14L4 11ZM6.5 10.5H16.5V11.5H6.5V10.5ZM18 10C18 9.44772 17.5523 9 17 9H6C5.44772 9 5 9.44772 5 10V12C5 12.5523 5.44772 13 6 13H17C17.5523 13 18 12.5523 18 12V10Z"/><path d="M2 16C2 16.5523 2.44772 17 3 17H15C15.5523 17 16 16.5523 16 16C16 15.4477 15.5523 15 15 15H3C2.44772 15 2 15.4477 2 16Z"/><path d="M2 6C2 6.55228 2.44772 7 3 7H15C15.5523 7 16 6.55228 16 6C16 5.44772 15.5523 5 15 5H3C2.44772 5 2 5.44772 2 6Z"/><path d="M2 2C2 2.55228 2.44772 3 3 3H15C15.5523 3 16 2.55228 16 2C16 1.44772 15.5523 1 15 1H3C2.44772 1 2 1.44772 2 2Z"/>
          </svg>`,

        "remove-row":
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.9951 10.1025C17.9438 10.6067 17.5177 11 17 11H12.4922L13.9922 9.5H16.5V5.5L1.5 5.5L1.5 9.5H4.00586L5.50586 11H1L0.897461 10.9951C0.427034 10.9472 0.0527828 10.573 0.00488281 10.1025L0 10L1.78814e-07 5C2.61831e-07 4.48232 0.393332 4.05621 0.897461 4.00488L1 4L17 4C17.5523 4 18 4.44772 18 5V10L17.9951 10.1025Z"/><path d="M11.2969 15.0146L8.99902 12.7168L6.7002 15.0146L5.63965 13.9541L7.93848 11.6562L5.63965 9.3584L6.7002 8.29785L8.99902 10.5957L11.2969 8.29785L12.3574 9.3584L10.0596 11.6562L12.3574 13.9541L11.2969 15.0146Z"/>
          </svg>`,

        "toggle-row-style":
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 2C1 1.44772 1.44772 1 2 1H7C7.55228 1 8 1.44772 8 2V7C8 7.55228 7.55228 8 7 8H2C1.44772 8 1 7.55228 1 7V2Z"/><path d="M2.5 15.5H6.5V11.5H2.5V15.5ZM8 16C8 16.5177 7.60667 16.9438 7.10254 16.9951L7 17H2L1.89746 16.9951C1.42703 16.9472 1.05278 16.573 1.00488 16.1025L1 16V11C1 10.4477 1.44772 10 2 10H7C7.55228 10 8 10.4477 8 11V16Z"/><path d="M10 2C10 1.44772 10.4477 1 11 1H16C16.5523 1 17 1.44772 17 2V7C17 7.55228 16.5523 8 16 8H11C10.4477 8 10 7.55228 10 7V2Z"/><path d="M11.5 15.5H15.5V11.5H11.5V15.5ZM17 16C17 16.5177 16.6067 16.9438 16.1025 16.9951L16 17H11L10.8975 16.9951C10.427 16.9472 10.0528 16.573 10.0049 16.1025L10 16V11C10 10.4477 10.4477 10 11 10H16C16.5523 10 17 10.4477 17 11V16Z"/>
          </svg>`,

        "add-column-before":
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 4L10 2.62268e-07L4 0L7 4ZM7.5 6.5L7.5 16.5H6.5L6.5 6.5H7.5ZM8 18C8.55228 18 9 17.5523 9 17V6C9 5.44772 8.55229 5 8 5H6C5.44772 5 5 5.44772 5 6L5 17C5 17.5523 5.44772 18 6 18H8Z"/><path d="M2 2C1.44772 2 1 2.44772 1 3L1 15C1 15.5523 1.44772 16 2 16C2.55228 16 3 15.5523 3 15L3 3C3 2.44772 2.55229 2 2 2Z"/><path d="M12 2C11.4477 2 11 2.44772 11 3L11 15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15L13 3C13 2.44772 12.5523 2 12 2Z"/><path d="M16 2C15.4477 2 15 2.44772 15 3L15 15C15 15.5523 15.4477 16 16 16C16.5523 16 17 15.5523 17 15V3C17 2.44772 16.5523 2 16 2Z"/>
          </svg>`,

        "add-column-after":
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 4L8 2.62268e-07L14 0L11 4ZM10.5 6.5V16.5H11.5V6.5H10.5ZM10 18C9.44772 18 9 17.5523 9 17V6C9 5.44772 9.44772 5 10 5H12C12.5523 5 13 5.44772 13 6V17C13 17.5523 12.5523 18 12 18H10Z"/><path d="M16 2C16.5523 2 17 2.44772 17 3L17 15C17 15.5523 16.5523 16 16 16C15.4477 16 15 15.5523 15 15V3C15 2.44772 15.4477 2 16 2Z"/><path d="M6 2C6.55228 2 7 2.44772 7 3L7 15C7 15.5523 6.55228 16 6 16C5.44772 16 5 15.5523 5 15L5 3C5 2.44772 5.44771 2 6 2Z"/><path d="M2 2C2.55228 2 3 2.44772 3 3L3 15C3 15.5523 2.55228 16 2 16C1.44772 16 1 15.5523 1 15V3C1 2.44772 1.44771 2 2 2Z"/>
          </svg>`,

        "remove-column":
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.1025 0.00488281C10.6067 0.0562145 11 0.482323 11 1V5.50781L9.5 4.00781V1.5H5.5V16.5H9.5V13.9941L11 12.4941V17L10.9951 17.1025C10.9472 17.573 10.573 17.9472 10.1025 17.9951L10 18H5C4.48232 18 4.05621 17.6067 4.00488 17.1025L4 17V1C4 0.447715 4.44772 1.61064e-08 5 0H10L10.1025 0.00488281Z"/><path d="M12.7169 8.99999L15.015 11.2981L13.9543 12.3588L11.6562 10.0607L9.35815 12.3588L8.29749 11.2981L10.5956 8.99999L8.29749 6.7019L9.35815 5.64124L11.6562 7.93933L13.9543 5.64124L15.015 6.7019L12.7169 8.99999Z"/>
          </svg>`,

        "toggle-column-style":
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 2C1 1.44772 1.44772 1 2 1H7C7.55228 1 8 1.44772 8 2V7C8 7.55228 7.55228 8 7 8H2C1.44772 8 1 7.55228 1 7V2Z"/><path d="M1 11C1 10.4477 1.44772 10 2 10H7C7.55228 10 8 10.4477 8 11V16C8 16.5523 7.55228 17 7 17H2C1.44772 17 1 16.5523 1 16V11Z"/><path d="M11.5 6.5H15.5V2.5H11.5V6.5ZM17 7C17 7.51768 16.6067 7.94379 16.1025 7.99512L16 8H11L10.8975 7.99512C10.427 7.94722 10.0528 7.57297 10.0049 7.10254L10 7V2C10 1.44772 10.4477 1 11 1H16C16.5523 1 17 1.44772 17 2V7Z"/><path d="M11.5 15.5H15.5V11.5H11.5V15.5ZM17 16C17 16.5177 16.6067 16.9438 16.1025 16.9951L16 17H11L10.8975 16.9951C10.427 16.9472 10.0528 16.573 10.0049 16.1025L10 16V11C10 10.4477 10.4477 10 11 10H16C16.5523 10 17 10.4477 17 11V16Z"/>
          </svg>`,

        "delete-table":
          `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.2129 19.2305C18.0925 20.7933 16.7892 22 15.2217 22H7.77832C6.21084 22 4.90753 20.7933 4.78711 19.2305L4 9H19L18.2129 19.2305Z"/><path d="M13 2C14.1046 2 15 2.89543 15 4H19C19.5523 4 20 4.44772 20 5V6C20 6.55228 19.5523 7 19 7H4C3.44772 7 3 6.55228 3 6V5C3 4.44772 3.44772 4 4 4H8C8 2.89543 8.89543 2 10 2H13Z"/>
          </svg>`
      }

    return icons[name]
  }
}

customElements.define("lexxy-table-handler", TableHandler)

