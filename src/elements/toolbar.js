import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  SKIP_DOM_SELECTION_TAG
} from "lexical"
import { getNonce } from "../helpers/csp_helper"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"
import { handleRollingTabIndex, isKeyboardActivation } from "../helpers/accessibility_helper"
import { isActiveAndVisible } from "../helpers/html_helper"
import { buildToolbarTemplate } from "./toolbar_template"

export class LexicalToolbarElement extends HTMLElement {
  static observedAttributes = [ "connected" ]

  static buildTemplate(items) {
    return buildToolbarTemplate(items)
  }

  #listeners = new ListenerBin()
  #refreshToolbarAF = null

  constructor() {
    super()
    this.internals = this.attachInternals()
    this.internals.role = "toolbar"

    this.#createEditorPromise()
  }

  connectedCallback() {
    this.requestOverflowRefresh()
    this.setAttribute("role", "toolbar")
    this.#installResizeObserver()
  }

  disconnectedCallback() {
    this.dispose()
  }

  dispose() {
    this.#listeners.dispose()

    cancelAnimationFrame(this.#refreshToolbarAF)

    this.editorElement = null
    this.editor = null
    this.selection = null
    this.#refreshToolbarAF = null

    this.#createEditorPromise()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect())
    }
  }

  configure(config) {
    if (typeof config === "object" && config !== null) {
      for (const [ option, value ] of Object.entries(config)) {
        if (option !== "items") this.setAttribute(`data-${option}`, value)
      }
    }
  }

  setEditor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.selection = editorElement.selection
    this.#bindButtons()
    this.#bindHotkeys()
    this.#resetTabIndexValues()
    this.#monitorSelectionChanges()
    this.#monitorHistoryChanges()
    this.requestOverflowRefresh()
    this.#bindFocusListeners()

    this.resolveEditorPromise(editorElement)

    this.toggleAttribute("connected", true)
  }

  async getEditorElement() {
    return this.editorElement || await this.editorPromise
  }

  requestOverflowRefresh() {
    if (this.#refreshToolbarAF != null) return

    this.#refreshToolbarAF = requestAnimationFrame(() => {
      this.#refreshOverflow()
      this.#refreshToolbarAF = null
    })
  }

  closeDropdowns({ except } = {}) {
    this.#dropdowns.forEach((dropdown) => {
      if (dropdown !== except) {
        dropdown.close({ focusEditor: false })
      }
    })
  }

  #reconnect() {
    this.disconnectedCallback()
    this.connectedCallback()
  }

  async #createEditorPromise() {
    this.editorPromise = new Promise((resolve) => {
      this.resolveEditorPromise = resolve
    })

    this.editorElement = await this.editorPromise
  }

  #installResizeObserver() {
    const resizeObserver = new ResizeObserver(() => this.requestOverflowRefresh())
    resizeObserver.observe(this)
    this.#listeners.track(() => resizeObserver.disconnect())
  }

  #bindButtons() {
    this.#listeners.track(registerEventListener(this, "click", this.#handleButtonClicked))
  }

  #handleButtonClicked = (event) => {
    this.#handleTargetClicked(event, "[data-command]", this.#dispatchButtonCommand.bind(this))
  }

  #handleTargetClicked(event, selector, callback) {
    const button = event.target.closest(selector)
    if (button) {
      callback(event, button)
    }
  }

  #dispatchButtonCommand(event, button) {
    if (button.ariaDisabled === "true") return

    const { command, payload } = button.dataset
    const shouldKeepToolbarFocus = isKeyboardActivation(event) && !this.#belongsToDropdown(button)

    this.editor.update(() => {
      this.editor.dispatchCommand(command, payload)
    }, { tag: shouldKeepToolbarFocus ? SKIP_DOM_SELECTION_TAG : undefined })

    if (!shouldKeepToolbarFocus) this.editor.focus()
  }

  #belongsToDropdown(button) {
    return button.closest("[data-dropdown-panel]") != null
  }

  #bindHotkeys() {
    this.#listeners.track(registerEventListener(this.editorElement, "keydown", this.#handleHotkey))
  }

  #handleHotkey = (event) => {
    const buttons = this.querySelectorAll("[data-hotkey]")
    buttons.forEach((button) => {
      const hotkeys = button.dataset.hotkey.toLowerCase().split(/\s+/)
      if (hotkeys.includes(this.#keyCombinationFor(event))) {
        event.preventDefault()
        event.stopPropagation()
        button.click()
      }
    })
  }

  #keyCombinationFor(event) {
    const pressedKey = event.key.toLowerCase()
    const modifiers = [
      event.ctrlKey ? "ctrl" : null,
      event.metaKey ? "cmd" : null,
      event.altKey ? "alt" : null,
      event.shiftKey ? "shift" : null,
    ].filter(Boolean)

    return [ ...modifiers, pressedKey ].join("+")
  }

  #bindFocusListeners() {
    this.#listeners.track(
      registerEventListener(this.editorElement, "lexxy:focus", this.#handleEditorFocus),
      registerEventListener(this.editorElement, "lexxy:blur", this.#handleEditorBlur),
      registerEventListener(this, "keydown", this.#handleKeydown)
    )
  }

  #handleEditorFocus = () => {
    const firstVisibleButton = this.#toolbarButtons.find(isActiveAndVisible)
    if (firstVisibleButton) firstVisibleButton.tabIndex = 0
  }

  #handleEditorBlur = () => {
    this.#resetTabIndexValues()
  }

  #handleKeydown = (event) => {
    handleRollingTabIndex(this.#toolbarButtons, event)
  }

  #resetTabIndexValues() {
    this.#toolbarButtons.forEach((button) => {
      button.tabIndex = -1
    })
  }

  #monitorSelectionChanges() {
    this.#listeners.track(this.editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        this.#updateButtonStates()
        this.closeDropdowns()
      })
    }))
  }

  #monitorHistoryChanges() {
    this.#listeners.track(
      this.editor.registerCommand(CAN_UNDO_COMMAND, (enabled) => { this.#setButtonDisabled("undo", !enabled) }, COMMAND_PRIORITY_LOW),
      this.editor.registerCommand(CAN_REDO_COMMAND, (enabled) => { this.#setButtonDisabled("redo", !enabled) }, COMMAND_PRIORITY_LOW),
    )
  }

  #updateButtonStates() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode()
    if (!anchorNode.getParent()) { return }

    const { isBold, isItalic, isStrikethrough, isUnderline, isHighlight, isInLink, isInQuote, isInHeading,
      headingTag, isInCode, isInList, listType, isInTable } = this.selection.getFormat()

    this.#setButtonPressed("bold", isBold)
    this.#setButtonPressed("italic", isItalic)
    this.#setButtonPressed("strikethrough", isStrikethrough)
    this.#setButtonPressed("underline", isUnderline)

    this.#setButtonPressed("format", isInHeading)
    this.#setButtonChecked("paragraph", !isInHeading)

    this.querySelector("lexxy-heading-dropdown")
      ?.updateActiveHeading(headingTag)

    this.#setButtonPressed("lists", isInList)
    this.#setButtonPressed("unordered-list", isInList && listType === "bullet")
    this.#setButtonPressed("ordered-list", isInList && listType === "number")

    this.#setButtonPressed("highlight", isHighlight)
    this.#setButtonPressed("link", isInLink)
    this.#setButtonPressed("quote", isInQuote)
    this.#setButtonPressed("code", isInCode)

    this.#setButtonPressed("table", isInTable)

    this.#updateGroupStates({ isInHeading })
  }

  #updateGroupStates({ isInHeading }) {
    this.querySelectorAll(":scope > [data-toolbar-group]").forEach((group) => {
      const hasPressedItem = group.panel.querySelector("[aria-pressed='true'], [role='menuitemcheckbox'][aria-checked='true']") != null
      const hasActiveHeading = isInHeading && group.querySelector("lexxy-heading-dropdown") != null
      group.trigger.ariaPressed = hasPressedItem || hasActiveHeading
    })
  }

  #setButtonPressed(name, isPressed) {
    const button = this.querySelector(`[name="${name}"]`)
    if (button?.getAttribute("role") === "menuitemcheckbox") {
      button.ariaChecked = isPressed
    } else if (button) {
      button.ariaPressed = isPressed
    }
  }

  #setButtonChecked(name, isChecked) {
    const button = this.querySelector(`[name="${name}"]`)
    if (button) button.ariaChecked = isChecked
  }

  #setButtonDisabled(name, isDisabled) {
    const button = this.querySelector(`[name="${name}"]`)
    if (button) button.ariaDisabled = isDisabled
  }

  #refreshOverflow() {
    this.#hideOverflowMenuButton()
    this.#resetToolbarOverflow()
    this.#reindexToolbarItems()
    this.#compactMenu()

    const isOverflowing = this.#overflowMenuDropdown.children.length > 0

    this.toggleAttribute("overflowing", isOverflowing)
    this.#setOverflowMenuNonce()
    this.#showOverflowMenuButton(isOverflowing)
  }

  #resetToolbarOverflow() {
    const items = Array.from(this.#overflowMenuDropdown.children)
    items.sort((a, b) => this.#itemPosition(b) - this.#itemPosition(a))

    for (const item of items) {
      const nextItem = this.querySelector(`[data-position="${this.#itemPosition(item) + 1}"]`) ?? this.#overflowMenuButton
      item.removeAttribute("role")
      this.insertBefore(item, nextItem)
    }
  }

  #showOverflowMenuButton(show = true) {
    this.#overflowMenuDropdown.toggleAttribute("disabled", !show)
    this.#overflowMenuButton.style.display = show ? "block" : "none"
  }

  #hideOverflowMenuButton() {
    this.#showOverflowMenuButton(false)
  }

  #itemPosition(item) {
    return parseInt(item.dataset.position ?? "999")
  }

  #reindexToolbarItems() {
    this.#toolbarItems.forEach((item, index) => {
      item.dataset.position = index
    })
  }

  #compactMenu() {
    const overflowWidth = this.#getOverflowWidth()

    if (overflowWidth > 0) {
      this.#showOverflowMenuButton()
      const gap = this.#getToolbarGap()
      const spaceForOverflow = gap + this.#overflowMenuButton.offsetWidth
      this.#reclaimWidth(overflowWidth + spaceForOverflow, { gap })
    }
  }

  #getOverflowWidth() {
    return this.scrollWidth - this.clientWidth
  }

  #reclaimWidth(overflowWidth, { gap }) {
    const buttons = this.#overflowableButtons
    const overflowButtons = []
    let recoveredWidth = 0

    while (recoveredWidth < overflowWidth && buttons.length) {
      const button = buttons.pop()

      overflowButtons.push(button)
      button.role = "menuitem"
      recoveredWidth += button.offsetWidth + gap
    }

    this.#overflowMenuDropdown.append(...overflowButtons.reverse())
  }

  #setOverflowMenuNonce() {
    this.#overflowMenuButton.setAttribute("nonce", getNonce())
  }

  #getToolbarGap() {
    return parseFloat(window.getComputedStyle(this).columnGap) || 0
  }

  get #dropdowns() {
    return this.querySelectorAll(":scope .lexxy-editor__toolbar-dropdown")
  }

  get #overflowMenuButton() {
    return this.querySelector(".lexxy-editor__toolbar-overflow")
  }

  get #overflowMenuDropdown() {
    return this.#overflowMenuButton?.querySelector(":scope > [data-dropdown-panel]")
  }

  get #overflowableButtons() {
    return Array.from(this.querySelectorAll(":scope > button:not([data-prevent-overflow])"))
  }

  get #toolbarButtons() {
    return Array.from(this.querySelectorAll(":scope button")).filter((button) => {
      return !button.closest("[data-dropdown-panel]")
    })
  }

  get #toolbarItems() {
    return Array.from(this.querySelectorAll(":scope > *:not(.lexxy-editor__toolbar-overflow)"))
  }
}

export default LexicalToolbarElement
