import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
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

import { handleRollingTabIndex } from "../helpers/accessibility_helper"
import { createElement } from "../helpers/html_helper"
import { capitalizeFirstLetter } from "../helpers/string_helper"

const TableAction = Object.freeze({
  INSERT:  "insert",
  DELETE: "delete",
  TOGGLE: "toggle"
})

const TableChildType = Object.freeze({
  ROW: "row",
  COLUMN: "column",
  TABLE: "table"
})

const TableDirection = Object.freeze({
  BEFORE: "before",
  AFTER: "after"
})

export class TableHandler extends HTMLElement {
  connectedCallback() {
    this.#setUpButtons()
    this.#monitorForTableSelection()
    this.#registerKeyboardShortcuts()
  }

  disconnectedCallback() {
    this.#unregisterKeyboardShortcuts()
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

  get #currentRowIndex() {
    const currentCell = this.#currentCell
    if (!currentCell) return 0
    return $getTableRowIndexFromTableCellNode(currentCell)
  }

  get #currentColumnIndex() {
    const currentCell = this.#currentCell
    if (!currentCell) return 0
    return $getTableColumnIndexFromTableCellNode(currentCell)
  }

  get #tableHandlerButtons() {
    return Array.from(this.buttonsContainer.querySelectorAll("button, details > summary"))
  }

  #registerKeyboardShortcuts() {
    this.unregisterKeyboardShortcuts = this.#editor.registerCommand(KEY_DOWN_COMMAND, this.#handleKeyDown, COMMAND_PRIORITY_HIGH)
  }

  #unregisterKeyboardShortcuts() {
    this.unregisterKeyboardShortcuts()
  }

  #handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "F10") {
      const firstButton = this.buttonsContainer?.querySelector("button, [tabindex]:not([tabindex='-1'])")
      firstButton?.focus()
    } else if (event.key === "Escape") {
      this.#editor.getEditorState().read(() => {
        const cell = this.#currentCell
        if (!cell) return

        this.#editor.update(() => {
          cell.select()
        })
      })
      this.#closeMoreMenu()
    }
  }

  #handleTableHandlerKeydown = (event) => {
    if (event.key === "Escape") {
      this.#editor.focus()
    } else {
      handleRollingTabIndex(this.#tableHandlerButtons, event)
    }
  }

  #setUpButtons() {
    this.buttonsContainer = createElement("div", {
      className: "lexxy-table-handle-buttons"
    })

    this.buttonsContainer.appendChild(this.#createRowButtonsContainer())
    this.buttonsContainer.appendChild(this.#createColumnButtonsContainer())

    this.moreMenu = this.#createMoreMenu()
    this.buttonsContainer.appendChild(this.moreMenu)
    this.buttonsContainer.addEventListener("keydown", this.#handleTableHandlerKeydown)

    this.#editorElement.appendChild(this.buttonsContainer)
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

  #updateRowColumnCount() {
    if (!this.currentTableNode) return

    const tableElement = $getElementForTableNode(this.#editor, this.currentTableNode)
    if (!tableElement) return

    const rowCount = tableElement.rows
    const columnCount = tableElement.columns

    this.rowCount.textContent = `${rowCount} row${rowCount === 1 ? "" : "s"}`
    this.columnCount.textContent = `${columnCount} column${columnCount === 1 ? "" : "s"}`
  }

  #createCommandButton(label, command) {
    const button = this.#createButton(label, this.#executeTableCommand, command)
    return button
  }

  #createButton(label, onClick, command = {}) {
    const button = createElement("button", {
      className: "lexxy-table-control__button",
      "aria-label": label,
      type: "button"
    })
    button.tabIndex = -1
    button.innerHTML = `${this.#icon(command)} <span>${label}</span>`
    button.addEventListener("click", () => onClick.call(this, command))
    button.addEventListener("mouseover", () => this.#handleActionHover(true, command))
    button.addEventListener("focus", () => this.#handleActionHover(true, command))
    button.addEventListener("mouseout", () => this.#handleActionHover(false, command))
    button.addEventListener("blur", () => this.#handleActionHover(false, command))

    return button
  }

  #handleActionHover(state, command) {
    this.#editor.getEditorState().read(() => {
      let cellsToHighlight = null

      switch (command.childType) {
        case TableChildType.ROW:
          cellsToHighlight = this.#getRowSiblingsOfCurrentCell()
          break
        case TableChildType.COLUMN:
          cellsToHighlight = this.#getColumnSiblingsOfCurrentCell()
          break
        case TableChildType.TABLE:
          cellsToHighlight = this.currentTableNode?.getChildren()
          break
      }

      if (!cellsToHighlight) return

      cellsToHighlight.forEach(cell => {
        const cellElement = this.#editor.getElementByKey(cell.getKey())
        if (!cellElement) return
        cellElement.classList.toggle("lexxy-content__table-cell--focused", state)

        if (state) {
          Object.assign(cellElement.dataset, command)
        } else {
          this.#clearCellStyles()
        }
      })
    })
  }

  #createRowButtonsContainer() {
    const container = createElement("div", { className: "lexxy-table-control" })

    const plusButton = this.#createCommandButton("Add row", { action: TableAction.INSERT, childType: TableChildType.ROW, direction: TableDirection.AFTER })
    const minusButton = this.#createCommandButton("Remove row", { action: TableAction.DELETE, childType: TableChildType.ROW })

    this.rowCount = createElement("span")
    this.rowCount.textContent = "_ rows"

    container.appendChild(minusButton)
    container.appendChild(this.rowCount)
    container.appendChild(plusButton)

    return container
  }

  #createColumnButtonsContainer() {
    const container = createElement("div", { className: "lexxy-table-control" })

    const plusButton = this.#createCommandButton("Add column", { action: TableAction.INSERT, childType: TableChildType.COLUMN, direction: TableDirection.AFTER })
    const minusButton = this.#createCommandButton("Remove column", { action: TableAction.DELETE, childType: TableChildType.COLUMN })

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
    container.setAttribute("name", "lexxy-dropdown")

    container.tabIndex = -1

    const summary = createElement("summary", {}, "•••")
    container.appendChild(summary)

    const details = createElement("div", { className: "lexxy-table-control__more-menu-details" })
    container.appendChild(details)

    details.appendChild(this.#createRowSection())
    details.appendChild(this.#createColumnSection())
    details.appendChild(this.#createDeleteTableSection())

    return container
  }

  #createColumnSection() {
    const columnSection = createElement("section", { className: "lexxy-table-control__more-menu-section" })

    const addColumnBeforeButton = this.#createCommandButton("Add column before", { action: TableAction.INSERT, childType: TableChildType.COLUMN, direction: TableDirection.BEFORE })
    const toggleColumnStyleButton = this.#createButton("Toggle column style", this.#toggleColumnHeaderStyle, { action: TableAction.TOGGLE, childType: TableChildType.COLUMN })

    columnSection.appendChild(addColumnBeforeButton)
    columnSection.appendChild(toggleColumnStyleButton)

    return columnSection
  }

  #createRowSection() {
    const rowSection = createElement("section", { className: "lexxy-table-control__more-menu-section" })

    const addRowAboveButton = this.#createCommandButton("Add row above", { action: TableAction.INSERT, childType: TableChildType.ROW, direction: TableDirection.BEFORE })
    const toggleRowStyleButton = this.#createButton("Toggle row style", this.#toggleRowHeaderStyle, { action: TableAction.TOGGLE, childType: TableChildType.ROW })

    rowSection.appendChild(addRowAboveButton)
    rowSection.appendChild(toggleRowStyleButton)

    return rowSection
  }

  #createDeleteTableSection() {
    const deleteSection = createElement("section", { className: "lexxy-table-control__more-menu-section" })

    const deleteButton = this.#createButton("Delete table", this.#deleteTable, { action: TableAction.DELETE, childType: TableChildType.TABLE })

    deleteSection.appendChild(deleteButton)

    return deleteSection
  }

  #closeMoreMenu() {
    this.#clearCellStyles()
    this.moreMenu?.removeAttribute("open")
  }

  #monitorForTableSelection() {
    this.#editor.registerUpdateListener(() => {
      this.#editor.getEditorState().read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        const anchorNode = selection.anchor.getNode()
        const tableNode = $findTableNode(anchorNode)

        if (tableNode) {
          this.#tableCellWasSelected(tableNode)
        } else {
          this.#hideTableHandlerButtons()
        }
      })
    })
  }

  #setTableFocusState(focused) {
    this.#editorElement.querySelector("div.node--selected:has(table)")?.classList.remove("node--selected")

    if (focused && this.currentTableNode) {
      const tableParent = this.#editor.getElementByKey(this.currentTableNode.getKey())
      if (!tableParent) return
      tableParent.classList.add("node--selected")
    }
  }

  #tableCellWasSelected(tableNode) {
    this.currentTableNode = tableNode
    this.#updateButtonsPosition(tableNode)
    this.#showTableHandlerButtons()
  }

  #getRowSiblingsOfCurrentCell() {
    const currentCell = this.#currentCell
    if (!currentCell) return

    const parentNode = currentCell.getParent()
    if (!parentNode) return

    const rows = this.currentTableNode.getChildren()
    const row = rows[this.#currentRowIndex]
    if (!row) return

    return row.getChildren()
  }

  #getColumnSiblingsOfCurrentCell() {
    const currentCell = this.#currentCell
    if (!currentCell) return

    const rows = this.currentTableNode.getChildren()
    const column = this.#currentColumnIndex

    const siblings = []

    rows.forEach(row => {
      const cell = row.getChildren()[column]
      if (!cell) return
      siblings.push(cell)
    })

    return siblings
  }

  #clearCellStyles() {
    this.#editorElement.querySelectorAll(".lexxy-content__table-cell--focused")?.forEach(cell => {
      cell.classList.remove("lexxy-content__table-cell--focused")
      cell.removeAttribute("data-action")
      cell.removeAttribute("data-child-type")
      cell.removeAttribute("data-direction")
    })
  }

  #selectFirstNewCell(command) {
    const { childType, direction } = command

    if (!this.currentTableNode) return

    const rows = this.currentTableNode.getChildren()
    let targetCell = null

    if (childType === TableChildType.ROW) {
      const targetRowIndex = direction === TableDirection.BEFORE ? this.#currentRowIndex - 1 : this.#currentRowIndex + 1
      targetCell = rows[targetRowIndex]?.getFirstChild()
    } else if (childType === TableChildType.COLUMN) {
      const targetColumnIndex = this.#currentColumnIndex
      targetCell = rows[0]?.getChildren()[targetColumnIndex]
    }

    if ($isTableCellNode(targetCell)) {
      targetCell.selectStart()
    }
  }

  #deleteTable() {
    this.#editor.dispatchCommand("deleteTable")

    this.#closeMoreMenu()
    this.#updateRowColumnCount()
  }

  #executeTableCommand(command) {
    this.#editor.update(() => {
      const currentCell = this.#currentCell
      if (!currentCell) return

      this.#editor.dispatchCommand(this.#commandName(command))

      if (command.action === TableAction.INSERT) {
        this.#selectFirstNewCell(command)
      }
    })

    this.#clearCellStyles()
    this.#closeMoreMenu()
    this.#updateRowColumnCount()
  }

  #commandName(command) {
    const { action, childType, direction } = command

    const childTypeSuffix = capitalizeFirstLetter(childType)
    const directionSuffix = action == TableAction.INSERT ? capitalizeFirstLetter(direction) : ""
    return `${action}Table${childTypeSuffix}${directionSuffix}`
  }

  #toggleRowHeaderStyle() {
    this.#editor.update(() => {
      const rows = this.currentTableNode.getChildren()

      const row = rows[this.#currentRowIndex]
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

      const row = rows[this.#currentRowIndex]
      if (!row) return

      const cells = row.getChildren()
      const selectedCell = $getTableCellNodeFromLexicalNode(cells[this.#currentColumnIndex])
      if (!selectedCell) return

      const currentStyle = selectedCell.getHeaderStyles()
      const newStyle = currentStyle ^ TableCellHeaderStates.COLUMN

      rows.forEach(row => {
        const cell = row.getChildren()[this.#currentColumnIndex]
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

  #icon(name) {
    const { action, childType, direction } = name
    const icons =
      {
        [TableAction.INSERT + TableChildType.ROW + TableDirection.BEFORE]:
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7L0 10V4L4 7ZM6.5 7.5H16.5V6.5H6.5V7.5ZM18 8C18 8.55228 17.5523 9 17 9H6C5.44772 9 5 8.55228 5 8V6C5 5.44772 5.44772 5 6 5H17C17.5523 5 18 5.44772 18 6V8Z"/><path d="M2 2C2 1.44772 2.44772 1 3 1H15C15.5523 1 16 1.44772 16 2C16 2.55228 15.5523 3 15 3H3C2.44772 3 2 2.55228 2 2Z"/><path d="M2 12C2 11.4477 2.44772 11 3 11H15C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13H3C2.44772 13 2 12.5523 2 12Z"/><path d="M2 16C2 15.4477 2.44772 15 3 15H15C15.5523 15 16 15.4477 16 16C16 16.5523 15.5523 17 15 17H3C2.44772 17 2 16.5523 2 16Z"/>
          </svg>`,

        [TableAction.INSERT + TableChildType.ROW + TableDirection.AFTER]:
          "+",

        [TableAction.DELETE + TableChildType.ROW]:
          "-",

        [TableAction.TOGGLE + TableChildType.ROW]:
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 2C1 1.44772 1.44772 1 2 1H7C7.55228 1 8 1.44772 8 2V7C8 7.55228 7.55228 8 7 8H2C1.44772 8 1 7.55228 1 7V2Z"/><path d="M2.5 15.5H6.5V11.5H2.5V15.5ZM8 16C8 16.5177 7.60667 16.9438 7.10254 16.9951L7 17H2L1.89746 16.9951C1.42703 16.9472 1.05278 16.573 1.00488 16.1025L1 16V11C1 10.4477 1.44772 10 2 10H7C7.55228 10 8 10.4477 8 11V16Z"/><path d="M10 2C10 1.44772 10.4477 1 11 1H16C16.5523 1 17 1.44772 17 2V7C17 7.55228 16.5523 8 16 8H11C10.4477 8 10 7.55228 10 7V2Z"/><path d="M11.5 15.5H15.5V11.5H11.5V15.5ZM17 16C17 16.5177 16.6067 16.9438 16.1025 16.9951L16 17H11L10.8975 16.9951C10.427 16.9472 10.0528 16.573 10.0049 16.1025L10 16V11C10 10.4477 10.4477 10 11 10H16C16.5523 10 17 10.4477 17 11V16Z"/>
          </svg>`,

        [TableAction.INSERT + TableChildType.COLUMN + TableDirection.BEFORE]:
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 4L10 2.62268e-07L4 0L7 4ZM7.5 6.5L7.5 16.5H6.5L6.5 6.5H7.5ZM8 18C8.55228 18 9 17.5523 9 17V6C9 5.44772 8.55229 5 8 5H6C5.44772 5 5 5.44772 5 6L5 17C5 17.5523 5.44772 18 6 18H8Z"/><path d="M2 2C1.44772 2 1 2.44772 1 3L1 15C1 15.5523 1.44772 16 2 16C2.55228 16 3 15.5523 3 15L3 3C3 2.44772 2.55229 2 2 2Z"/><path d="M12 2C11.4477 2 11 2.44772 11 3L11 15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15L13 3C13 2.44772 12.5523 2 12 2Z"/><path d="M16 2C15.4477 2 15 2.44772 15 3L15 15C15 15.5523 15.4477 16 16 16C16.5523 16 17 15.5523 17 15V3C17 2.44772 16.5523 2 16 2Z"/>
          </svg>`,

        [TableAction.INSERT + TableChildType.COLUMN + TableDirection.AFTER]:
          "+",

        [TableAction.DELETE + TableChildType.COLUMN]:
          "-",

        [TableAction.TOGGLE + TableChildType.COLUMN]:
          `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 2C1 1.44772 1.44772 1 2 1H7C7.55228 1 8 1.44772 8 2V7C8 7.55228 7.55228 8 7 8H2C1.44772 8 1 7.55228 1 7V2Z"/><path d="M1 11C1 10.4477 1.44772 10 2 10H7C7.55228 10 8 10.4477 8 11V16C8 16.5523 7.55228 17 7 17H2C1.44772 17 1 16.5523 1 16V11Z"/><path d="M11.5 6.5H15.5V2.5H11.5V6.5ZM17 7C17 7.51768 16.6067 7.94379 16.1025 7.99512L16 8H11L10.8975 7.99512C10.427 7.94722 10.0528 7.57297 10.0049 7.10254L10 7V2C10 1.44772 10.4477 1 11 1H16C16.5523 1 17 1.44772 17 2V7Z"/><path d="M11.5 15.5H15.5V11.5H11.5V15.5ZM17 16C17 16.5177 16.6067 16.9438 16.1025 16.9951L16 17H11L10.8975 16.9951C10.427 16.9472 10.0528 16.573 10.0049 16.1025L10 16V11C10 10.4477 10.4477 10 11 10H16C16.5523 10 17 10.4477 17 11V16Z"/>
          </svg>`,

        [TableAction.DELETE + TableChildType.TABLE]:
          `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.2129 19.2305C18.0925 20.7933 16.7892 22 15.2217 22H7.77832C6.21084 22 4.90753 20.7933 4.78711 19.2305L4 9H19L18.2129 19.2305Z"/><path d="M13 2C14.1046 2 15 2.89543 15 4H19C19.5523 4 20 4.44772 20 5V6C20 6.55228 19.5523 7 19 7H4C3.44772 7 3 6.55228 3 6V5C3 4.44772 3.44772 4 4 4H8C8 2.89543 8.89543 2 10 2H13Z"/>
          </svg>`
      }

    return icons[action + childType + (action == TableAction.INSERT ? direction : "")]
  }
}

customElements.define("lexxy-table-handler", TableHandler)

