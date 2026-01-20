import {
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
} from "lexical"
import {
  $getElementForTableNode
} from "@lexical/table"

import { TableAction, TableChildType, TableController, TableDirection } from "./table_controller"
import { handleRollingTabIndex } from "../../helpers/accessibility_helper"
import { createElement } from "../../helpers/html_helper"

const HIGHLIGHT_CLASS = "lexxy-content__table-cell--highlight"
const FOCUS_CLASS = "lexxy-content__table-cell--focus"

export class TableTools extends HTMLElement {
  connectedCallback() {
    this.#cleanup()
    this.tableController = new TableController(this.#editorElement)

    this.#setUpButtons()
    this.#monitorForTableSelection()
    this.#registerKeyboardShortcuts()
  }

  disconnectedCallback() {
    this.#cleanup()
  }

  get #editor() {
    return this.#editorElement.editor
  }

  get #editorElement() {
    return this.closest("lexxy-editor")
  }

  get #tableToolsButtons() {
    return Array.from(this.querySelectorAll("button, details > summary"))
  }

  #setUpButtons() {
    this.appendChild(this.#createRowButtonsContainer())
    this.appendChild(this.#createColumnButtonsContainer())

    this.appendChild(this.#createDeleteTableButton())
    this.addEventListener("keydown", this.#handleToolsKeydown)
  }

  #createButtonsContainer(childType, setCountProperty, moreMenu) {
    const container = createElement("div", { className: `lexxy-table-control lexxy-table-control--${childType}` })

    const plusButton = this.#createButton(`Add ${childType}`, { action: TableAction.INSERT, childType, direction: TableDirection.AFTER }, "+")
    const minusButton = this.#createButton(`Remove ${childType}`, { action: TableAction.DELETE, childType }, "−")

    const dropdown = createElement("details", { className: "lexxy-table-control__more-menu" })
    dropdown.setAttribute("name", "lexxy-dropdown")
    dropdown.tabIndex = -1

    const count = createElement("summary", {}, `_ ${childType}s`)
    setCountProperty(count)
    dropdown.appendChild(count)

    dropdown.appendChild(moreMenu)

    container.appendChild(minusButton)
    container.appendChild(dropdown)
    container.appendChild(plusButton)

    return container
  }

  #createRowButtonsContainer() {
    return this.#createButtonsContainer(
      TableChildType.ROW,
      (count) => { this.rowCount = count },
      this.#createMoreMenuSection(TableChildType.ROW)
    )
  }

  #createColumnButtonsContainer() {
    return this.#createButtonsContainer(
      TableChildType.COLUMN,
      (count) => { this.columnCount = count },
      this.#createMoreMenuSection(TableChildType.COLUMN)
    )
  }

  #createMoreMenuSection(childType) {
    const section = createElement("div", { className: "lexxy-table-control__more-menu-details" })
    const addBeforeButton = this.#createButton(`Add ${childType} before`, { action: TableAction.INSERT, childType, direction: TableDirection.BEFORE })
    const addAfterButton = this.#createButton(`Add ${childType} after`, { action: TableAction.INSERT, childType, direction: TableDirection.AFTER })
    const toggleStyleButton = this.#createButton(`Toggle ${childType} style`, { action: TableAction.TOGGLE, childType })
    const deleteButton = this.#createButton(`Remove ${childType}`, { action: TableAction.DELETE, childType })

    section.appendChild(addBeforeButton)
    section.appendChild(addAfterButton)
    section.appendChild(toggleStyleButton)
    section.appendChild(deleteButton)

    return section
  }

  #createDeleteTableButton() {
    const container = createElement("div", { className: "lexxy-table-control" })

    const deleteTableButton = this.#createButton("Delete this table?", { action: TableAction.DELETE, childType: TableChildType.TABLE })
    deleteTableButton.classList.add("lexxy-table-control__button--delete-table")

    container.appendChild(deleteTableButton)

    this.deleteContainer = container

    return container
  }

  #createButton(label, command = {}, icon = this.#icon(command)) {
    const button = createElement("button", {
      className: "lexxy-table-control__button",
      "aria-label": label,
      type: "button"
    })
    button.tabIndex = -1
    button.innerHTML = `${icon} <span>${label}</span>`

    button.dataset.action = command.action
    button.dataset.childType = command.childType
    button.dataset.direction = command.direction

    button.addEventListener("click", () => this.#executeTableCommand(command))

    button.addEventListener("mouseover", () => this.#handleCommandButtonHover())
    button.addEventListener("focus", () => this.#handleCommandButtonHover())
    button.addEventListener("mouseout", () => this.#handleCommandButtonHover())

    return button
  }

  #registerKeyboardShortcuts() {
    this.unregisterKeyboardShortcuts = this.#editor.registerCommand(KEY_DOWN_COMMAND, this.#handleAccessibilityShortcutKey, COMMAND_PRIORITY_HIGH)
  }

  #unregisterKeyboardShortcuts() {
    this.unregisterKeyboardShortcuts?.()
    this.unregisterKeyboardShortcuts = null
  }

  #handleAccessibilityShortcutKey = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "F10") {
      const firstButton = this.querySelector("button, [tabindex]:not([tabindex='-1'])")
      firstButton?.focus()
    }
  }

  #handleToolsKeydown = (event) => {
    if (event.key === "Escape") {
      this.#handleEscapeKey()
    } else {
      handleRollingTabIndex(this.#tableToolsButtons, event)
    }
  }

  #handleEscapeKey() {
    const cell = this.tableController.currentCell
    if (!cell) return

    this.#editor.update(() => {
      cell.select()
      this.#editor.focus()
    })

    this.#finishTableOperation()
  }

  #handleCommandButtonHover() {
    requestAnimationFrame(() => {
      this.#clearCellStyles()

      const activeElement = this.querySelector("button:hover, button:focus")
      if (!activeElement) return

      const command = {
        action: activeElement.dataset.action,
        childType: activeElement.dataset.childType,
        direction: activeElement.dataset.direction
      }

      let cellsToHighlight = null

      switch (command.childType) {
        case TableChildType.ROW:
          cellsToHighlight = this.tableController.currentRowCells
          break
        case TableChildType.COLUMN:
          cellsToHighlight = this.tableController.currentColumnCells
          break
        case TableChildType.TABLE:
          cellsToHighlight = this.tableController.tableRows
          break
      }

      if (!cellsToHighlight) return

      cellsToHighlight.forEach(cell => {
        const cellElement = this.#editor.getElementByKey(cell.getKey())
        if (!cellElement) return
        cellElement.classList.toggle(HIGHLIGHT_CLASS, true)

        Object.assign(cellElement.dataset, command)
      })
    })
  }

  #monitorForTableSelection() {
    this.unregisterUpdateListener = this.#editor.registerUpdateListener(() => {
      this.tableController.updateSelectedTable()

      const tableNode = this.tableController.currentTableNode
      if (tableNode) {
        this.#tableCellWasSelected(tableNode)
      } else {
        this.#hideTableToolsButtons()
      }
    })
  }

  #cleanup() {
    this.#unregisterKeyboardShortcuts()

    this.unregisterUpdateListener?.()
    this.unregisterUpdateListener = null

    this.removeEventListener("keydown", this.#handleToolsKeydown)

    this.tableController?.destroy?.()
    this.tableController = null
  }

  #executeTableCommand(command) {
    if (command.action === TableAction.DELETE && command.childType === TableChildType.TABLE) {
      this.tableController.deleteTable()
    } else {
      this.tableController.executeTableCommand(command)
    }

    this.#finishTableOperation()
  }

  #finishTableOperation() {
    this.#closeMoreMenu()
    this.#updateRowColumnCount()
    this.#handleCommandButtonHover()
  }

  #showTableToolsButtons() {
    this.style.display = "flex"
    this.#closeMoreMenu()

    this.#updateRowColumnCount()
  }

  #hideTableToolsButtons() {
    this.style.display = "none"
    this.#closeMoreMenu()

    this.#setTableCellFocus()
  }

  #updateButtonsPosition() {
    const tableNode = this.tableController.currentTableNode
    if (!tableNode) return

    const tableElement = this.#editor.getElementByKey(tableNode.getKey())
    if (!tableElement) return

    const tableRect = tableElement.getBoundingClientRect()
    const editorRect = this.#editorElement.getBoundingClientRect()

    const relativeTop = tableRect.top - editorRect.top
    const relativeCenter = (tableRect.left + tableRect.right) / 2 - editorRect.left
    this.style.top = `${relativeTop}px`
    this.style.left = `${relativeCenter}px`
  }

  #updateRowColumnCount() {
    const tableNode = this.tableController.currentTableNode
    if (!tableNode) return

    const tableElement = $getElementForTableNode(this.#editor, tableNode)
    if (!tableElement) return

    const rowCount = tableElement.rows
    const columnCount = tableElement.columns

    this.rowCount.textContent = `${rowCount} row${rowCount === 1 ? "" : "s"}`
    this.columnCount.textContent = `${columnCount} column${columnCount === 1 ? "" : "s"}`
  }

  #tableCellWasSelected() {
    this.#updateButtonsPosition()
    this.#showTableToolsButtons()
    this.#setTableCellFocus()
  }

  #setTableCellFocus() {
    this.#editorElement.querySelectorAll(`.${FOCUS_CLASS}`)?.forEach(cell => {
      cell.classList.remove(FOCUS_CLASS)
    })

    const cell = this.tableController.currentCell
    if (!cell) return

    const cellElement = this.#editor.getElementByKey(cell.getKey())
    if (!cellElement) return

    cellElement.classList.add(FOCUS_CLASS)
  }

  #clearCellStyles() {
    this.#editorElement.querySelectorAll(`.${HIGHLIGHT_CLASS}`)?.forEach(cell => {
      cell.classList.remove(HIGHLIGHT_CLASS)
      cell.removeAttribute("data-action")
      cell.removeAttribute("data-child-type")
      cell.removeAttribute("data-direction")
    })
  }

  #closeMoreMenu() {
    this.querySelector("details[open]")?.removeAttribute("open")
  }

  #icon(command) {
    const { action, childType, direction } = command
    return ICONS[action + childType + (action == TableAction.INSERT ? direction : "")]
  }
}

const ICONS = Object.freeze({
  [TableAction.INSERT + TableChildType.ROW + TableDirection.BEFORE]:
    `<svg  viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.86804e-07 15C8.29055e-07 15.8284 0.671574 16.5 1.5 16.5H15L15.1533 16.4922C15.8593 16.4205 16.4205 15.8593 16.4922 15.1533L16.5 15V4.5L16.4922 4.34668C16.4154 3.59028 15.7767 3 15 3H13.5L13.5 4.5H15V9H1.5L1.5 4.5L3 4.5V3H1.5C0.671574 3 1.20956e-06 3.67157 1.24577e-06 4.5L7.86804e-07 15ZM15 10.5V15H1.5L1.5 10.5H15Z"/>
    <path d="M4.5 4.5H7.5V7.5H9V4.5H12L12 3L9 3V6.55671e-08L7.5 0V3L4.5 3V4.5Z"/>
    </svg>`,

  [TableAction.INSERT + TableChildType.ROW + TableDirection.AFTER]:
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M7.86804e-07 13.5C7.50592e-07 14.3284 0.671574 15 1.5 15H3V13.5H1.5L1.5 9L15 9V13.5H13.5V15H15C15.7767 15 16.4154 14.4097 16.4922 13.6533L16.5 13.5V3L16.4922 2.84668C16.4205 2.14069 15.8593 1.57949 15.1533 1.50781L15 1.5L1.5 1.5C0.671574 1.5 1.28803e-06 2.17157 1.24577e-06 3L7.86804e-07 13.5ZM15 3V7.5L1.5 7.5L1.5 3L15 3Z"/>
  <path d="M7.5 15V18H9V15H12V13.5H9V10.5H7.5V13.5H4.5V15H7.5Z"/>
  </svg>`,

  [TableAction.DELETE + TableChildType.ROW]:
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.4922 12.1533C16.4154 12.9097 15.7767 13.5 15 13.5L12 13.5V12H15V6L1.5 6L1.5 12H4.5V13.5H1.5C0.723337 13.5 0.0846104 12.9097 0.00781328 12.1533L7.86804e-07 12L1.04907e-06 6C1.17362e-06 5.22334 0.590278 4.58461 1.34668 4.50781L1.5 4.5L15 4.5C15.8284 4.5 16.5 5.17157 16.5 6V12L16.4922 12.1533Z"/>
    <path d="M10.3711 15.9316L8.25 13.8096L6.12793 15.9316L5.06738 14.8711L7.18945 12.75L5.06738 10.6289L6.12793 9.56836L8.25 11.6895L10.3711 9.56836L11.4316 10.6289L9.31055 12.75L11.4316 14.8711L10.3711 15.9316Z"/>
    </svg>`,

  [TableAction.TOGGLE + TableChildType.ROW]:
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.00781328 13.6533C0.0846108 14.4097 0.723337 15 1.5 15L15 15L15.1533 14.9922C15.8593 14.9205 16.4205 14.3593 16.4922 13.6533L16.5 13.5V4.5L16.4922 4.34668C16.4205 3.64069 15.8593 3.07949 15.1533 3.00781L15 3L1.5 3C0.671574 3 1.24863e-06 3.67157 1.18021e-06 4.5L7.86804e-07 13.5L0.00781328 13.6533ZM15 9V13.5L1.5 13.5L1.5 9L15 9Z"/>
    </svg>`,

  [TableAction.INSERT + TableChildType.COLUMN + TableDirection.BEFORE]:
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 0C3.67157 0 3 0.671573 3 1.5V3H4.5V1.5H9V15H4.5V13.5H3V15C3 15.7767 3.59028 16.4154 4.34668 16.4922L4.5 16.5H15L15.1533 16.4922C15.8593 16.4205 16.4205 15.8593 16.4922 15.1533L16.5 15V1.5C16.5 0.671573 15.8284 6.03989e-09 15 0H4.5ZM15 15H10.5V1.5H15V15Z"/>
    <path d="M3 7.5H0V9H3V12H4.5V9H7.5V7.5H4.5V4.5H3V7.5Z"/>
    </svg>`,

  [TableAction.INSERT + TableChildType.COLUMN + TableDirection.AFTER]:
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 0C14.3284 0 15 0.671573 15 1.5V3H13.5V1.5H9V15H13.5V13.5H15V15C15 15.7767 14.4097 16.4154 13.6533 16.4922L13.5 16.5H3L2.84668 16.4922C2.14069 16.4205 1.57949 15.8593 1.50781 15.1533L1.5 15V1.5C1.5 0.671573 2.17157 6.03989e-09 3 0H13.5ZM3 15H7.5V1.5H3V15Z"/>
  <path d="M15 7.5H18V9H15V12H13.5V9H10.5V7.5H13.5V4.5H15V7.5Z"/>
  </svg>`,

  [TableAction.DELETE + TableChildType.COLUMN]:
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.1533 0.0078125C12.9097 0.0846097 13.5 0.723336 13.5 1.5V4.5H12V1.5H6V15H12V12H13.5V15C13.5 15.7767 12.9097 16.4154 12.1533 16.4922L12 16.5H6C5.22334 16.5 4.58461 15.9097 4.50781 15.1533L4.5 15V1.5C4.5 0.671573 5.17157 2.41596e-08 6 0H12L12.1533 0.0078125Z"/>
    <path d="M15.9316 6.12891L13.8105 8.24902L15.9326 10.3711L14.8711 11.4316L12.75 9.31055L10.6289 11.4316L9.56738 10.3711L11.6885 8.24902L9.56836 6.12891L10.6289 5.06836L12.75 7.18848L14.8711 5.06836L15.9316 6.12891Z"/>
    </svg>`,

  [TableAction.TOGGLE + TableChildType.COLUMN]:
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.6533 17.9922C14.4097 17.9154 15 17.2767 15 16.5L15 3L14.9922 2.84668C14.9205 2.14069 14.3593 1.57949 13.6533 1.50781L13.5 1.5L4.5 1.5L4.34668 1.50781C3.59028 1.58461 3 2.22334 3 3L3 16.5C3 17.2767 3.59028 17.9154 4.34668 17.9922L4.5 18L13.5 18L13.6533 17.9922ZM9 3L13.5 3L13.5 16.5L9 16.5L9 3Z" />
    </svg>`,

  [TableAction.DELETE + TableChildType.TABLE]:
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.2129 19.2305C18.0925 20.7933 16.7892 22 15.2217 22H7.77832C6.21084 22 4.90753 20.7933 4.78711 19.2305L4 9H19L18.2129 19.2305Z"/><path d="M13 2C14.1046 2 15 2.89543 15 4H19C19.5523 4 20 4.44772 20 5V6C20 6.55228 19.5523 7 19 7H4C3.44772 7 3 6.55228 3 6V5C3 4.44772 3.44772 4 4 4H8C8 2.89543 8.89543 2 10 2H13Z"/>
    </svg>`
})

customElements.define("lexxy-table-tools", TableTools)
