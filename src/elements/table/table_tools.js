import { COMMAND_PRIORITY_HIGH, KEY_DOWN_COMMAND } from "lexical"
import { $getElementForTableNode } from "@lexical/table"

import { TableController } from "./table_controller"
import TableIcons from "./table_icons"
import theme from "../../config/theme"
import { handleRollingTabIndex } from "../../helpers/accessibility_helper"
import { createElement } from "../../helpers/html_helper"
import { nextFrame } from "../../helpers/timing_helper"
import { ListenerBin, registerEventListener } from "../../helpers/listener_helper"

export class TableTools extends HTMLElement {
  #listeners = new ListenerBin()

  connectedCallback() {
    this.tableController = new TableController(this.editorElement)
    this.classList.add("lexxy-floating-controls")
    this.role = "toolbar"

    this.#setUpButtons()
    this.#hide()
    this.#monitorForTableSelection()
    this.#registerKeyboardShortcuts()
  }

  disconnectedCallback() {
    this.dispose()
  }

  dispose() {
    this.#listeners.dispose()

    this.tableController?.destroy()
    this.tableController = null
  }

  get editorElement() {
    return this.closest("lexxy-editor")
  }

  get editor() {
    return this.editorElement.editor
  }

  getEditorElement() {
    return this.editorElement
  }

  closeDropdowns({ except } = {}) {
    this.#moreMenus.forEach(menu => {
      if (menu !== except) menu.close({ focusEditor: false })
    })
  }

  get #moreMenus() {
    return this.querySelectorAll("lexxy-toolbar-dropdown")
  }

  get #hasOpenMoreMenu() {
    return Array.from(this.#moreMenus).some(menu => menu.isOpen)
  }

  get #tableToolsButtons() {
    return Array.from(this.querySelectorAll("button")).filter(button => !button.closest("[data-dropdown-panel]"))
  }

  #setUpButtons() {
    this.innerHTML = ""

    this.appendChild(this.#createRowButtonsContainer())
    this.appendChild(this.#createColumnButtonsContainer())

    this.appendChild(this.#createDeleteTableButton())
    this.#listeners.track(registerEventListener(this, "keydown", this.#handleToolsKeydown))
  }

  #createButtonsContainer(childType, setCountProperty, moreMenu) {
    const container = createElement("div", { className: `lexxy-floating-controls__group lexxy-table-control lexxy-table-control--${childType}` })

    const plusButton = this.#createButton(`Add ${childType}`, { action: "insert", childType, direction: "after" }, "+")
    const minusButton = this.#createButton(`Remove ${childType}`, { action: "delete", childType }, "−")

    container.appendChild(minusButton)
    container.appendChild(this.#createMoreMenu(childType, setCountProperty, moreMenu))
    container.appendChild(plusButton)

    return container
  }

  #createMoreMenu(childType, setCountProperty, menu) {
    const dropdown = createElement("lexxy-toolbar-dropdown", { className: "lexxy-table-control__more-menu" })

    const trigger = createElement("button", {
      type: "button",
      className: "lexxy-table-control__more-menu-trigger",
      dataset: { dropdownTrigger: "" },
      "aria-haspopup": "menu",
      "aria-expanded": "false"
    }, `_ ${childType}s`)
    trigger.tabIndex = -1
    setCountProperty(trigger)

    menu.dataset.dropdownPanel = ""
    menu.role = "menu"
    menu.setAttribute("aria-label", `${childType} options`)
    menu.hidden = true

    dropdown.appendChild(trigger)
    dropdown.appendChild(menu)

    return dropdown
  }

  #createRowButtonsContainer() {
    return this.#createButtonsContainer(
      "row",
      (count) => { this.rowCount = count },
      this.#createMoreMenuSection("row")
    )
  }

  #createColumnButtonsContainer() {
    return this.#createButtonsContainer(
      "column",
      (count) => { this.columnCount = count },
      this.#createMoreMenuSection("column")
    )
  }

  #createMoreMenuSection(childType) {
    const section = createElement("div", { className: "lexxy-floating-controls__group lexxy-table-control__more-menu-details" })

    const items = [
      this.#createButton(`Add ${childType} before`, { action: "insert", childType, direction: "before" }),
      this.#createButton(`Add ${childType} after`, { action: "insert", childType, direction: "after" }),
      this.#createButton(`Toggle ${childType} style`, { action: "toggle", childType }),
      this.#createButton(`Remove ${childType}`, { action: "delete", childType })
    ]

    items.forEach(item => {
      item.role = "menuitem"
      section.appendChild(item)
    })

    return section
  }

  #createDeleteTableButton() {
    const container = createElement("div", { className: "lexxy-table-control lexxy-floating-controls__group" })

    const deleteTableButton = this.#createButton("Delete this table?", { action: "delete", childType: "table" })
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
    this.#listeners.track(this.editor.registerCommand(KEY_DOWN_COMMAND, this.#focusToolbarOnAltF10, COMMAND_PRIORITY_HIGH))
  }

  #focusToolbarOnAltF10 = (event) => {
    if (this.#hasSelectedTable && event.altKey && event.key === "F10") {
      event.preventDefault()
      // Ask for the ring explicitly: a programmatic focus coming from a mouse-focused
      // editor otherwise inherits the mouse modality and paints no focus ring.
      this.#tableToolsButtons[0]?.focus({ focusVisible: true })
      return true
    } else {
      return false
    }
  }

  get #hasSelectedTable() {
    return this.tableController?.currentTableNodeKey != null
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

    this.editor.update(() => {
      cell.select()
      this.editor.focus()
    })

    this.#update()
  }

  async #handleCommandButtonHover() {
    await nextFrame()

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
      case "row":
        cellsToHighlight = this.tableController.currentRowCells
        break
      case "column":
        cellsToHighlight = this.tableController.currentColumnCells
        break
      case "table":
        cellsToHighlight = this.tableController.tableRows
        break
    }

    if (!cellsToHighlight) return

    cellsToHighlight.forEach(cell => {
      const cellElement = this.editor.getElementByKey(cell.getKey())
      if (!cellElement) return

      cellElement.classList.toggle(theme.tableCellHighlight, true)
      Object.assign(cellElement.dataset, command)
    })
  }

  #monitorForTableSelection() {
    this.#listeners.track(this.editor.registerUpdateListener(() => {
      const tableNode = this.editor.getRootElement() && this.tableController.updateSelectedTable()

      if (tableNode) {
        this.#show()
      } else {
        this.#hide()
      }
    }))
  }

  #executeTableCommand(command) {
    const fromMoreMenu = this.#hasOpenMoreMenu

    this.tableController.executeTableCommand(command)
    this.#update()

    if (fromMoreMenu) this.editor.focus()
  }

  #show() {
    this.#updateButtonsPosition()
    this.style.display = "flex"
    this.#updateRowColumnCount()
    this.#closeMoreMenu()
    this.#handleCommandButtonHover()
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
    this.closeDropdowns()
  }

  #updateButtonsPosition() {
    const tableNode = this.tableController.currentTableNode
    if (!tableNode) return

    const tableElement = this.editor.getElementByKey(tableNode.getKey())
    if (!tableElement) return

    const tableRect = tableElement.getBoundingClientRect()
    const editorRect = this.editorElement.getBoundingClientRect()

    const relativeTop = tableRect.top - editorRect.top
    const relativeCenter = (tableRect.left + tableRect.right) / 2 - editorRect.left
    this.style.top = `${relativeTop}px`
    this.style.left = `${relativeCenter}px`
  }

  #updateRowColumnCount() {
    const tableNode = this.tableController.currentTableNode
    if (!tableNode) return

    const tableElement = $getElementForTableNode(this.editor, tableNode)
    if (!tableElement) return

    const rowCount = tableElement.rows
    const columnCount = tableElement.columns

    this.rowCount.textContent = `${rowCount} row${rowCount === 1 ? "" : "s"}`
    this.columnCount.textContent = `${columnCount} column${columnCount === 1 ? "" : "s"}`
  }

  #setTableCellFocus() {
    const cell = this.tableController.currentCell
    if (!cell) return

    const cellElement = this.editor.getElementByKey(cell.getKey())
    if (!cellElement) return

    cellElement.classList.add(theme.tableCellFocus)
  }

  #clearCellStyles() {
    this.editorElement.querySelectorAll(`.${theme.tableCellFocus}`)?.forEach(cell => {
      cell.classList.remove(theme.tableCellFocus)
    })

    this.editorElement.querySelectorAll(`.${theme.tableCellHighlight}`)?.forEach(cell => {
      cell.classList.remove(theme.tableCellHighlight)
      cell.removeAttribute("data-action")
      cell.removeAttribute("data-child-type")
      cell.removeAttribute("data-direction")
    })

    this.#setTableCellFocus()
  }

  #icon(command) {
    const { action, childType } = command
    const direction = (action == "insert" ? command.direction : null)
    const iconId = [ action, childType, direction ].filter(Boolean).join("-")
    return TableIcons[iconId]
  }
}

export default TableTools
