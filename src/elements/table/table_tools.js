import { COMMAND_PRIORITY_HIGH, KEY_DOWN_COMMAND } from "lexical"
import { $getElementForTableNode } from "@lexical/table"

import { TableAction, TableChildType, TableController, TableDirection } from "./table_controller"
import { TableIcons } from "./table_icons"
import { handleRollingTabIndex } from "../../helpers/accessibility_helper"
import { createElement } from "../../helpers/html_helper"
import theme from "../../config/theme"

export class TableTools extends HTMLElement {
  connectedCallback() {
    this.tableController = new TableController(this.#editorElement)

    this.#setUpButtons()
    this.#monitorForTableSelection()
    this.#registerKeyboardShortcuts()
  }

  disconnectedCallback() {
    this.#unregisterKeyboardShortcuts()

    this.unregisterUpdateListener?.()
    this.unregisterUpdateListener = null

    this.removeEventListener("keydown", this.#handleToolsKeydown)

    this.tableController?.destroy?.()
    this.tableController = null
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

    this.#update()
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

        cellElement.classList.toggle(theme.tableCellHighlight, true)
        Object.assign(cellElement.dataset, command)
      })
    })
  }

  #monitorForTableSelection() {
    this.unregisterUpdateListener = this.#editor.registerUpdateListener(() => {
      this.tableController.updateSelectedTable()

      const tableNode = this.tableController.currentTableNode
      if (tableNode) {
        this.#show()
      } else {
        this.#hide()
      }
    })
  }

  #executeTableCommand(command) {
    if (command.action === TableAction.DELETE && command.childType === TableChildType.TABLE) {
      this.tableController.deleteTable()
    } else {
      this.tableController.executeTableCommand(command)
    }

    this.#update()
  }

  #show() {
    this.style.display = "flex"
    this.#update()
  }

  #hide() {
    this.style.display = "none"
    this.#clearCellStyles()
  }

  #update() {
    this.#updateButtonsPosition()
    this.#updateRowColumnCount()
    this.#closeMoreMenu()
    this.#handleCommandButtonHover()
  }

  #closeMoreMenu() {
    this.querySelector("details[open]")?.removeAttribute("open")
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

  #setTableCellFocus() {
    const cell = this.tableController.currentCell
    if (!cell) return

    const cellElement = this.#editor.getElementByKey(cell.getKey())
    if (!cellElement) return

    cellElement.classList.add(theme.tableCellFocus)
  }

  #clearCellStyles() {
    this.#editorElement.querySelectorAll(`.${theme.tableCellFocus}`)?.forEach(cell => {
      cell.classList.remove(theme.tableCellFocus)
    })

    this.#editorElement.querySelectorAll(`.${theme.tableCellHighlight}`)?.forEach(cell => {
      cell.classList.remove(theme.tableCellHighlight)
      cell.removeAttribute("data-action")
      cell.removeAttribute("data-child-type")
      cell.removeAttribute("data-direction")
    })

    this.#setTableCellFocus()
  }

  #icon(command) {
    const { action, childType } = command
    const direction = (action == TableAction.INSERT ? command.direction : "")
    const iconId = [ action, childType, direction ].join("")
    return TableIcons[iconId]
  }
}

customElements.define("lexxy-table-tools", TableTools)
