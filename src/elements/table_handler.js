import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_NORMAL,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
} from "lexical"
import {
  $findCellNode,
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

const ICONS = Object.freeze({
  [TableAction.INSERT + TableChildType.ROW + TableDirection.BEFORE]:
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7L0 10V4L4 7ZM6.5 7.5H16.5V6.5H6.5V7.5ZM18 8C18 8.55228 17.5523 9 17 9H6C5.44772 9 5 8.55228 5 8V6C5 5.44772 5.44772 5 6 5H17C17.5523 5 18 5.44772 18 6V8Z"/><path d="M2 2C2 1.44772 2.44772 1 3 1H15C15.5523 1 16 1.44772 16 2C16 2.55228 15.5523 3 15 3H3C2.44772 3 2 2.55228 2 2Z"/><path d="M2 12C2 11.4477 2.44772 11 3 11H15C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13H3C2.44772 13 2 12.5523 2 12Z"/><path d="M2 16C2 15.4477 2.44772 15 3 15H15C15.5523 15 16 15.4477 16 16C16 16.5523 15.5523 17 15 17H3C2.44772 17 2 16.5523 2 16Z"/>
    </svg>`,

  [TableAction.INSERT + TableChildType.ROW + TableDirection.AFTER]:
    "+",

  [TableAction.DELETE + TableChildType.ROW]:
    "–",

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
    "–",

  [TableAction.TOGGLE + TableChildType.COLUMN]:
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 2C1 1.44772 1.44772 1 2 1H7C7.55228 1 8 1.44772 8 2V7C8 7.55228 7.55228 8 7 8H2C1.44772 8 1 7.55228 1 7V2Z"/><path d="M1 11C1 10.4477 1.44772 10 2 10H7C7.55228 10 8 10.4477 8 11V16C8 16.5523 7.55228 17 7 17H2C1.44772 17 1 16.5523 1 16V11Z"/><path d="M11.5 6.5H15.5V2.5H11.5V6.5ZM17 7C17 7.51768 16.6067 7.94379 16.1025 7.99512L16 8H11L10.8975 7.99512C10.427 7.94722 10.0528 7.57297 10.0049 7.10254L10 7V2C10 1.44772 10.4477 1 11 1H16C16.5523 1 17 1.44772 17 2V7Z"/><path d="M11.5 15.5H15.5V11.5H11.5V15.5ZM17 16C17 16.5177 16.6067 16.9438 16.1025 16.9951L16 17H11L10.8975 16.9951C10.427 16.9472 10.0528 16.573 10.0049 16.1025L10 16V11C10 10.4477 10.4477 10 11 10H16C16.5523 10 17 10.4477 17 11V16Z"/>
    </svg>`,

  [TableAction.DELETE + TableChildType.TABLE]:
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.2129 19.2305C18.0925 20.7933 16.7892 22 15.2217 22H7.77832C6.21084 22 4.90753 20.7933 4.78711 19.2305L4 9H19L18.2129 19.2305Z"/><path d="M13 2C14.1046 2 15 2.89543 15 4H19C19.5523 4 20 4.44772 20 5V6C20 6.55228 19.5523 7 19 7H4C3.44772 7 3 6.55228 3 6V5C3 4.44772 3.44772 4 4 4H8C8 2.89543 8.89543 2 10 2H13Z"/>
    </svg>`
})

export class TableHandler extends HTMLElement {
  connectedCallback() {
    this.#setUpButtons()
    this.#monitorForTableSelection()
    this.#registerKeyboardShortcuts()
    this.#handleEnterKey()
    this.#handleBackspaceKey()
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

  get currentCell() {
    if (!this.currentCellKey) return null

    return this.#editor.getEditorState().read(() => {
      const node = $getNodeByKey(this.currentCellKey)
      return $findCellNode(node)
    })
  }

  get currentTableNode() {
    if (!this.currentTableNodeKey) return null

    const cell = this.currentCell
    if (!cell) return null

    return this.#editor.getEditorState().read(() => {
      return $findTableNode(cell)
    })
  }

  get #currentRowCells() {
    const currentRowIndex = this.#currentRowIndex

    const rows = this.#tableRows
    if (!rows) return null

    return this.#editor.getEditorState().read(() => {
      return rows[currentRowIndex]?.getChildren() ?? null
    }) ?? null
  }

  get #currentRowIndex() {
    const currentCell = this.currentCell
    if (!currentCell) return 0

    return this.#editor.getEditorState().read(() => {
      return $getTableRowIndexFromTableCellNode(currentCell)
    }) ?? 0
  }

  get #currentColumnCells() {
    const rows = this.#tableRows
    const columnIndex = this.#currentColumnIndex

    return this.#editor.getEditorState().read(() => {
      return rows?.map(row => row.getChildAtIndex(columnIndex)) ?? null
    }) ?? null
  }

  get #currentColumnIndex() {
    const currentCell = this.currentCell
    if (!currentCell) return 0

    return this.#editor.getEditorState().read(() => {
      return $getTableColumnIndexFromTableCellNode(currentCell)
    }) ?? 0
  }

  get #tableRows() {
    return this.#editor.getEditorState().read(() => {
      return this.currentTableNode?.getChildren()
    }) ?? null
  }

  get #tableHandlerButtons() {
    return Array.from(this.querySelectorAll("button, details > summary"))
  }

  #setUpButtons() {
    this.appendChild(this.#createRowButtonsContainer())
    this.appendChild(this.#createColumnButtonsContainer())

    this.moreMenu = this.#createMoreMenu()
    this.appendChild(this.moreMenu)
    this.addEventListener("keydown", this.#handleTableHandlerKeydown)
  }

  #createRowButtonsContainer() {
    return this.#createButtonsContainer(
      "row",
      "Add row",
      "Remove row",
      TableChildType.ROW,
      (count) => { this.rowCount = count }
    )
  }

  #createColumnButtonsContainer() {
    return this.#createButtonsContainer(
      "column",
      "Add column",
      "Remove column",
      TableChildType.COLUMN,
      (count) => { this.columnCount = count }
    )
  }

  #createButtonsContainer(type, addLabel, removeLabel, childType, setCountProperty) {
    const container = createElement("div", { className: "lexxy-table-control" })

    const plusButton = this.#createCommandButton(addLabel, { action: TableAction.INSERT, childType, direction: TableDirection.AFTER })
    const minusButton = this.#createCommandButton(removeLabel, { action: TableAction.DELETE, childType })

    const count = createElement("span")
    count.textContent = `_ ${type}s`
    setCountProperty(count)

    container.appendChild(minusButton)
    container.appendChild(count)
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

  #createRowSection() {
    const section = this.#createMenuSection()
    const addRowAboveButton = this.#createCommandButton("Add row above", { action: TableAction.INSERT, childType: TableChildType.ROW, direction: TableDirection.BEFORE })
    const toggleRowStyleButton = this.#createButton("Toggle row style", this.#toggleRowHeaderStyle, { action: TableAction.TOGGLE, childType: TableChildType.ROW })

    section.appendChild(addRowAboveButton)
    section.appendChild(toggleRowStyleButton)

    return section
  }

  #createColumnSection() {
    const section = this.#createMenuSection()
    const addColumnBeforeButton = this.#createCommandButton("Add column before", { action: TableAction.INSERT, childType: TableChildType.COLUMN, direction: TableDirection.BEFORE })
    const toggleColumnStyleButton = this.#createButton("Toggle column style", this.#toggleColumnHeaderStyle, { action: TableAction.TOGGLE, childType: TableChildType.COLUMN })

    section.appendChild(addColumnBeforeButton)
    section.appendChild(toggleColumnStyleButton)

    return section
  }

  #createDeleteTableSection() {
    const section = this.#createMenuSection()
    const deleteButton = this.#createButton("Delete table", this.#deleteTable, { action: TableAction.DELETE, childType: TableChildType.TABLE })

    section.appendChild(deleteButton)

    return section
  }

  #createMenuSection() {
    return createElement("section", { className: "lexxy-table-control__more-menu-section" })
  }

  #createButton(label, onClick, command = {}) {
    const button = createElement("button", {
      className: "lexxy-table-control__button",
      "aria-label": label,
      type: "button"
    })
    button.tabIndex = -1
    button.innerHTML = `${this.#icon(command)} <span>${label}</span>`

    button.dataset.action = command.action
    button.dataset.childType = command.childType
    button.dataset.direction = command.direction

    button.addEventListener("click", () => onClick.call(this, command))

    button.addEventListener("mouseover", () => this.#handleCommandButtonHover())
    button.addEventListener("focus", () => this.#handleCommandButtonHover())
    button.addEventListener("mouseout", () => this.#handleCommandButtonHover())

    return button
  }

  #createCommandButton(label, command) {
    return this.#createButton(label, this.#executeTableCommand, command)
  }

  #registerKeyboardShortcuts() {
    this.unregisterKeyboardShortcuts = this.#editor.registerCommand(KEY_DOWN_COMMAND, this.#handleKeyDown, COMMAND_PRIORITY_HIGH)
  }

  #unregisterKeyboardShortcuts() {
    this.unregisterKeyboardShortcuts()
  }

  #handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "F10") {
      this.#handleAccessibilityShortcutKey()
    } else if (event.key === "Escape") {
      this.#handleEscapeKey()
    }
  }

  #handleAccessibilityShortcutKey() {
    const firstButton = this.querySelector("button, [tabindex]:not([tabindex='-1'])")
    firstButton?.focus()
  }

  #handleEscapeKey() {
    const cell = this.currentCell
    if (!cell) return

    this.#editor.update(() => {
      cell.select()
    })
    this.#closeMoreMenu()
  }

  #handleBackspaceKey() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.#editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {

        if (!this.currentTableNode) return false

        if (this.#isCurrentRowEmpty()) {
          event.preventDefault()

          this.#executeTableCommand({ action: TableAction.DELETE, childType: TableChildType.ROW })

          const rows = this.#tableRows
          if (!rows || rows.length === 0) return

          this.#selectLastCellInCurrentRow()
        } else if (this.#isCurrentCellEmpty()) {
          event.preventDefault()

          const cell = this.currentCell
          if (!cell) return

          this.#editor.update(() => {
            cell.selectPrevious()
          })
        }

        return true
      },
      COMMAND_PRIORITY_NORMAL
    )
  }

  #handleEnterKey() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.#editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {

        if (event.shiftKey ||!this.currentTableNode) return false

        event.preventDefault()

        if (this.#isCurrentRowLast() && this.#isCurrentRowEmpty()) {
          this.#executeTableCommand({ action: TableAction.DELETE, childType: TableChildType.ROW })

          this.#editor.update(() => {
            const next = this.currentTableNode?.getNextSibling()
            if (next) {
              next.selectStart()
            } else {
              const newParagraph = $createParagraphNode()
              this.currentTableNode.insertAfter(newParagraph)
              newParagraph.selectStart()
            }
          })
        } else if (this.#isCurrentRowLast()) {
          this.#executeTableCommand({ action: TableAction.INSERT, childType: TableChildType.ROW, direction: TableDirection.AFTER })
        } else {
          const rows = this.#tableRows
          if (!rows) return

          const nextRow = rows.at(this.#currentRowIndex + 1)
          if (!nextRow) return

          this.#editor.update(() => {
            nextRow.getChildAtIndex(this.#currentColumnIndex)?.selectStart()
          })
        }

        return true
      },
      COMMAND_PRIORITY_NORMAL
    )
  }

  #handleTableHandlerKeydown = (event) => {
    if (event.key === "Escape") {
      this.#editor.focus()
    } else {
      handleRollingTabIndex(this.#tableHandlerButtons, event)
    }
  }

  #handleCommandButtonHover() {
    this.#clearCellStyles()

    requestAnimationFrame(() => {
      const activeElement = this.querySelector("button:hover, button:focus")
      if (!activeElement) {
        return
      }

      const command = {
        action: activeElement.dataset.action,
        childType: activeElement.dataset.childType,
        direction: activeElement.dataset.direction
      }

      let cellsToHighlight = null

      switch (command.childType) {
        case TableChildType.ROW:
          cellsToHighlight = this.#currentRowCells
          break
        case TableChildType.COLUMN:
          cellsToHighlight = this.#currentColumnCells
          break
        case TableChildType.TABLE:
          cellsToHighlight = this.#tableRows
          break
      }

      if (!cellsToHighlight) return

      cellsToHighlight.forEach(cell => {
        const cellElement = this.#editor.getElementByKey(cell.getKey())
        if (!cellElement) return
        cellElement.classList.toggle("lexxy-content__table-cell--focused", true)

        Object.assign(cellElement.dataset, command)
      })
    })
  }

  #monitorForTableSelection() {
    this.#editor.registerUpdateListener(() => {
      this.#editor.getEditorState().read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        const anchorNode = selection.anchor.getNode()
        const tableNode = $findTableNode(anchorNode)

        if (tableNode) {
          const cellNode = $findCellNode(anchorNode)
          this.currentCellKey = cellNode?.getKey() ?? null
          this.#tableCellWasSelected(tableNode)
        } else {
          this.#hideTableHandlerButtons()
          this.currentCellKey = null
        }
      })
    })
  }

  #deleteTable() {
    this.#editor.dispatchCommand("deleteTable")
  }

  #executeTableCommand(command) {
    this.#editor.dispatchCommand(this.#commandName(command))

    if (command.action === TableAction.INSERT) {
      this.#selectFirstNewCell(command)
    }

    this.#finishTableOperation()
  }

  #finishTableOperation() {
    this.#closeMoreMenu()
    this.#updateRowColumnCount()
    this.#handleCommandButtonHover()
  }

  #toggleRowHeaderStyle() {
    this.#editor.update(() => {
      this.#toggleHeaderStyle(this.#currentRowCells, TableCellHeaderStates.ROW)
    })
  }

  #toggleColumnHeaderStyle() {
    this.#editor.update(() => {
      this.#toggleHeaderStyle(this.#currentColumnCells, TableCellHeaderStates.COLUMN)
    })
  }

  #toggleHeaderStyle(cells, headerState) {
    if (!cells || cells.length === 0) return

    const firstCell = $getTableCellNodeFromLexicalNode(cells[0])
    if (!firstCell) return

    const currentStyle = firstCell.getHeaderStyles()
    const newStyle = currentStyle ^ headerState

    cells.forEach(cell => {
      this.#setHeaderStyle(cell, newStyle, headerState)
    })
  }

  #showTableHandlerButtons() {
    this.style.display = "flex"
    this.#closeMoreMenu()

    this.#updateRowColumnCount()
    this.#setTableFocusState(true)
  }

  #hideTableHandlerButtons() {
    this.style.display = "none"
    this.#closeMoreMenu()

    this.#setTableFocusState(false)
    this.currentTableNodeKey = null
  }

  #updateButtonsPosition() {
    const tableElement = this.#editor.getElementByKey(this.currentTableNodeKey)
    if (!tableElement) return

    const tableRect = tableElement.getBoundingClientRect()
    const editorRect = this.#editorElement.getBoundingClientRect()

    const relativeTop = tableRect.top - editorRect.top
    const relativeCenter = (tableRect.left + tableRect.right) / 2 - editorRect.left
    this.style.top = `${relativeTop}px`
    this.style.left = `${relativeCenter}px`
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

  #setTableFocusState(focused) {
    this.#editorElement.querySelector("div.node--selected:has(table)")?.classList.remove("node--selected")

    if (focused && this.currentTableNodeKey) {
      const tableParent = this.#editor.getElementByKey(this.currentTableNodeKey)
      if (!tableParent) return
      tableParent.classList.add("node--selected")
    }
  }

  #clearCellStyles() {
    this.#editorElement.querySelectorAll(".lexxy-content__table-cell--focused")?.forEach(cell => {
      cell.classList.remove("lexxy-content__table-cell--focused")
      cell.removeAttribute("data-action")
      cell.removeAttribute("data-child-type")
      cell.removeAttribute("data-direction")
    })
  }

  #setHeaderStyle(cell, newStyle, headerState) {
    const tableCellNode = $getTableCellNodeFromLexicalNode(cell)

    if (tableCellNode) {
      tableCellNode.setHeaderStyles(newStyle, headerState)
    }
  }

  #selectFirstNewCell(command) {
    if (!this.currentTableNode) return

    let rowIndex = this.#currentRowIndex
    let columnIndex = this.#currentColumnIndex

    const { childType, direction } = command

    if (direction === TableDirection.AFTER) {
      if (childType === TableChildType.ROW) {
        rowIndex = rowIndex + 1
      } else if (childType === TableChildType.COLUMN) {
        columnIndex = columnIndex + 1
      }
    }

    this.#editor.update(() => {
      const targetCell = this.currentTableNode.getChildAtIndex(rowIndex)?.getChildAtIndex(columnIndex)

      if ($isTableCellNode(targetCell)) {
        targetCell.selectStart()
      }
    })
  }

  #selectLastCellInCurrentRow() {
    if (!this.currentTableNode) return

    const rows = this.#tableRows
    if (!rows) return

    const currentRow = rows[this.#currentRowIndex - 1]

    this.#editor.update(() => {
      const cells = currentRow?.getChildren()
      if (!cells) return

      const lastCell = $getTableCellNodeFromLexicalNode(cells.at(-1))
      if (!lastCell) return

      lastCell.selectEnd()
    })
  }

  #closeMoreMenu() {
    this.moreMenu?.removeAttribute("open")
  }

  #commandName(command) {
    const { action, childType, direction } = command

    const childTypeSuffix = capitalizeFirstLetter(childType)
    const directionSuffix = action == TableAction.INSERT ? capitalizeFirstLetter(direction) : ""
    return `${action}Table${childTypeSuffix}${directionSuffix}`
  }

  #tableCellWasSelected(tableNode) {
    this.currentTableNodeKey = tableNode.getKey()
    this.#updateButtonsPosition()
    this.#showTableHandlerButtons()
  }

  #isCurrentCellEmpty() {
    if (!this.currentTableNode) return false

    const cell = this.currentCell
    if (!cell) return false

    return cell.getTextContent().trim() === ""
  }

  #isCurrentRowLast() {
    if (!this.currentTableNode) return false

    const rows = this.#tableRows
    if (!rows) return false

    return rows.length === this.#currentRowIndex + 1
  }

  #isCurrentRowEmpty() {
    if (!this.currentTableNode) return false

    const cells = this.#currentRowCells
    if (!cells) return false

    return cells.every(cell => cell.getTextContent().trim() === "")
  }

  #icon(command) {
    const { action, childType, direction } = command
    return ICONS[action + childType + (action == TableAction.INSERT ? direction : "")]
  }
}

customElements.define("lexxy-table-handler", TableHandler)
