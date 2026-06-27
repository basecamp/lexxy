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
import ToolbarIcons from "./toolbar_icons"
import { generateDomId, isActiveAndVisible } from "../helpers/html_helper"

export class LexicalToolbarElement extends HTMLElement {
  static observedAttributes = [ "connected" ]
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
      for (const [ button, value ] of Object.entries(config)) {
        this.setAttribute(`data-${button}`, value)
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
    this.#setButtonChecked("heading-large", headingTag === "h2")
    this.#setButtonChecked("heading-medium", headingTag === "h3")
    this.#setButtonChecked("heading-small", headingTag === "h4")

    this.#setButtonPressed("lists", isInList)
    this.#setButtonPressed("unordered-list", isInList && listType === "bullet")
    this.#setButtonPressed("ordered-list", isInList && listType === "number")

    this.#setButtonPressed("highlight", isHighlight)
    this.#setButtonPressed("link", isInLink)
    this.#setButtonPressed("quote", isInQuote)
    this.#setButtonPressed("code", isInCode)

    this.#setButtonPressed("table", isInTable)
  }

  #setButtonPressed(name, isPressed) {
    const button = this.querySelector(`[name="${name}"]`)
    if (button) button.ariaPressed = isPressed
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

  static get defaultTemplate() {
    const linkInputId = generateDomId("lexxy-link-url")

    return `
      <button class="lexxy-editor__toolbar-button" type="button" name="image" data-command="uploadImage" data-prevent-overflow="true" title="Add images and video">
        ${ToolbarIcons.image}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="file" data-command="uploadFile" title="Upload files">
        ${ToolbarIcons.attachment}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="bold" data-command="bold" title="Bold">
        ${ToolbarIcons.bold}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="italic" data-command="italic" title="Italic">
      ${ToolbarIcons.italic}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="strikethrough" data-command="strikethrough" title="Strikethrough">
        ${ToolbarIcons.strikethrough}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="underline" data-command="underline" title="Underline">
        ${ToolbarIcons.underline}
      </button>

      <lexxy-toolbar-dropdown class="lexxy-editor__toolbar-dropdown">
        <button data-dropdown-trigger class="lexxy-editor__toolbar-button lexxy-editor__toolbar-button--chevron" type="button" name="format" title="Text formatting" aria-haspopup="menu" aria-expanded="false">
          ${ToolbarIcons.heading}
        </button>
        <div data-dropdown-panel role="menu" class="lexxy-editor__toolbar-dropdown-list" hidden>
          <button type="button" name="paragraph" data-command="setFormatParagraph" title="Paragraph" role="menuitemradio">
            ${ToolbarIcons.paragraph} <span>Normal</span>
          </button>
          <button type="button" name="heading-large" data-command="setFormatHeadingLarge" title="Large heading" role="menuitemradio">
            ${ToolbarIcons.h2} <span>Large Heading</span>
          </button>
          <button type="button" name="heading-medium" data-command="setFormatHeadingMedium" title="Medium heading" role="menuitemradio">
            ${ToolbarIcons.h3} <span>Medium Heading</span>
          </button>
          <button class="lexxy-editor__toolbar-group-end" type="button" name="heading-small" data-command="setFormatHeadingSmall" title="Small heading" role="menuitemradio">
            ${ToolbarIcons.h4} <span>Small Heading</span>
          </button>
          <div class="lexxy-editor__toolbar-separator" role="separator"></div>
          <button type="button" name="clear-formatting" data-command="clearFormatting" title="Clear formatting" role="menuitem">
            ${ToolbarIcons.clearFormatting} <span>Clear formatting</span>
          </button>
        </div>
      </lexxy-toolbar-dropdown>

      <lexxy-highlight-dropdown class="lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-dropdown--highlight">
        <button data-dropdown-trigger class="lexxy-editor__toolbar-button lexxy-editor__toolbar-button--chevron" type="button" name="highlight" title="Color highlight" aria-haspopup="menu" aria-expanded="false">
          ${ToolbarIcons.highlight}
        </button>
        <div data-dropdown-panel role="menu" hidden>
          <div class="lexxy-highlight-colors"></div>
          <button data-command="removeHighlight" type="button" class="lexxy-editor__toolbar-button lexxy-editor__toolbar-dropdown-reset" role="menuitem">Remove all coloring</button>
        </div>
      </lexxy-highlight-dropdown>

      <lexxy-link-dropdown class="lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-dropdown--link">
        <button data-dropdown-trigger class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="link" title="Link" data-hotkey="cmd+k ctrl+k" aria-haspopup="dialog" aria-expanded="false">
          ${ToolbarIcons.link}
        </button>
        <div data-dropdown-panel role="dialog" aria-label="Link" hidden>
          <input type="url" placeholder="Enter a URL…" class="input" id="${linkInputId}">
          <div class="lexxy-editor__toolbar-dropdown-actions">
            <button type="button" class="lexxy-editor__toolbar-button" value="link">Link</button>
            <button type="button" class="lexxy-editor__toolbar-button" value="unlink">Unlink</button>
          </div>
        </div>
      </lexxy-link-dropdown>

      <button class="lexxy-editor__toolbar-button" type="button" name="quote" data-command="insertQuoteBlock" title="Quote">
        ${ToolbarIcons.quote}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="code" data-command="insertCodeBlock" title="Code">
        ${ToolbarIcons.code}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="unordered-list" data-command="insertUnorderedList" title="Bullet list">
        ${ToolbarIcons.ul}
      </button>
      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="ordered-list" data-command="insertOrderedList" title="Numbered list">
        ${ToolbarIcons.ol}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="table" data-command="insertTable" title="Insert a table">
        ${ToolbarIcons.table}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="divider" data-command="insertHorizontalDivider" title="Insert a divider">
        ${ToolbarIcons.hr}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-button--push-right" type="button" name="undo" data-command="undo" title="Undo" aria-disabled="true">
        ${ToolbarIcons.undo}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="redo" data-command="redo" title="Redo" aria-disabled="true">
        ${ToolbarIcons.redo}
      </button>

      <lexxy-toolbar-dropdown class="lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-button--push-right lexxy-editor__toolbar-overflow">
        <button data-dropdown-trigger class="lexxy-editor__toolbar-button" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Show more toolbar buttons">
          ${ToolbarIcons.overflow}
        </button>
        <div data-dropdown-panel role="menu" class="lexxy-editor__toolbar-overflow-menu" aria-label="More toolbar buttons" hidden></div>
      </lexxy-toolbar-dropdown>
    `
  }
}

export default LexicalToolbarElement
