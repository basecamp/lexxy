import {
  $getSelection,
  $isRangeSelection,
  SKIP_DOM_SELECTION_TAG
} from "lexical"
import { getNonce } from "../helpers/csp_helper"
import { handleRollingTabIndex } from "../helpers/accessibility_helper"
import ToolbarIcons from "./toolbar_icons"

export class LexicalToolbarElement extends HTMLElement {
  static observedAttributes = [ "connected" ]

  constructor() {
    super()
    this.internals = this.attachInternals()
    this.internals.role = "toolbar"

    this.#createEditorPromise()
  }

  connectedCallback() {
    requestAnimationFrame(() => this.#refreshToolbarOverflow())
    this.setAttribute("role", "toolbar")
    this.#installResizeObserver()
  }

  disconnectedCallback() {
    this.#uninstallResizeObserver()
    this.#unbindHotkeys()
    this.#unbindFocusListeners()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect())
    }
  }

  setEditor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.selection = editorElement.selection
    this.#bindButtons()
    this.#bindHotkeys()
    this.#resetTabIndexValues()
    this.#setItemPositionValues()
    this.#monitorSelectionChanges()
    this.#monitorHistoryChanges()
    this.#refreshToolbarOverflow()
    this.#bindFocusListeners()

    this.resolveEditorPromise(editorElement)

    this.toggleAttribute("connected", true)
  }

  async getEditorElement() {
    return this.editorElement || await this.editorPromise
  }

  #reconnect() {
    this.disconnectedCallback()
    this.connectedCallback()
  }

  #createEditorPromise() {
    this.editorPromise = new Promise((resolve) => {
      this.resolveEditorPromise = resolve
    })
  }

  #installResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => this.#refreshToolbarOverflow())
    this.resizeObserver.observe(this)
  }

  #uninstallResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  }

  #bindButtons() {
    this.addEventListener("click", this.#handleButtonClicked.bind(this))
  }

  #handleButtonClicked(event) {
    this.#handleTargetClicked(event, "[data-command]", this.#dispatchButtonCommand.bind(this))
  }

  #handleTargetClicked(event, selector, callback) {
    const button = event.target.closest(selector)
    if (button) {
      callback(event, button)
    }
  }

  #dispatchButtonCommand(event, { dataset: { command, payload } }) {
    const isKeyboard = event instanceof PointerEvent && event.pointerId === -1

    this.editor.update(() => {
      this.editor.dispatchCommand(command, payload)
    }, { tag: isKeyboard ? SKIP_DOM_SELECTION_TAG : undefined })
  }

  #bindHotkeys() {
    this.editorElement.addEventListener("keydown", this.#handleHotkey)
  }

  #unbindHotkeys() {
    this.editorElement?.removeEventListener("keydown", this.#handleHotkey)
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
    this.editorElement.addEventListener("lexxy:focus", this.#handleEditorFocus)
    this.editorElement.addEventListener("lexxy:blur", this.#handleEditorBlur)
    this.addEventListener("keydown", this.#handleKeydown)
  }

  #unbindFocusListeners() {
    this.editorElement.removeEventListener("lexxy:focus", this.#handleEditorFocus)
    this.editorElement.removeEventListener("lexxy:blur", this.#handleEditorBlur)
    this.removeEventListener("keydown", this.#handleKeydown)
  }

  #handleEditorFocus = () => {
    this.#focusableItems[0].tabIndex = 0
  }

  #handleEditorBlur = () => {
    this.#resetTabIndexValues()
    this.#closeDropdowns()
  }

  #handleKeydown = (event) => {
    handleRollingTabIndex(this.#focusableItems, event)
  }

  #resetTabIndexValues() {
    this.#focusableItems.forEach((button) => {
      button.tabIndex = -1
    })
  }

  #monitorSelectionChanges() {
    this.editor.registerUpdateListener(() => {
      this.editor.getEditorState().read(() => {
        this.#updateButtonStates()
        this.#closeDropdowns()
      })
    })
  }

  #monitorHistoryChanges() {
    this.editor.registerUpdateListener(() => {
      this.#updateUndoRedoButtonStates()
    })
  }

  #updateUndoRedoButtonStates() {
    this.editor.getEditorState().read(() => {
      const historyState = this.editorElement.historyState
      if (historyState) {
        this.#setButtonDisabled("undo", historyState.undoStack.length === 0)
        this.#setButtonDisabled("redo", historyState.redoStack.length === 0)
      }
    })
  }

  #updateButtonStates() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode()
    if (!anchorNode.getParent()) { return }

    const { isBold, isItalic, isStrikethrough, isHighlight, isInLink, isInQuote, isInHeading,
      isInCode, isInList, listType, isInTable } = this.selection.getFormat()

    this.#setButtonPressed("bold", isBold)
    this.#setButtonPressed("italic", isItalic)
    this.#setButtonPressed("strikethrough", isStrikethrough)
    this.#setButtonPressed("highlight", isHighlight)
    this.#setButtonPressed("link", isInLink)
    this.#setButtonPressed("quote", isInQuote)
    this.#setButtonPressed("heading", isInHeading)
    this.#setButtonPressed("code", isInCode)
    this.#setButtonPressed("unordered-list", isInList && listType === "bullet")
    this.#setButtonPressed("ordered-list", isInList && listType === "number")
    this.#setButtonPressed("table", isInTable)

    this.#updateUndoRedoButtonStates()
  }

  #setButtonPressed(name, isPressed) {
    const button = this.querySelector(`[name="${name}"]`)
    if (button) {
      button.setAttribute("aria-pressed", isPressed.toString())
    }
  }

  #setButtonDisabled(name, isDisabled) {
    const button = this.querySelector(`[name="${name}"]`)
    if (button) {
      button.disabled = isDisabled
      button.setAttribute("aria-disabled", isDisabled.toString())
    }
  }

  #toolbarIsOverflowing() {
    // Safari can report inconsistent clientWidth values on more than 100% window zoom level,
    // that was affecting the toolbar overflow calculation. We're adding +1 to get around this issue.
    return (this.scrollWidth - this.#overflow.clientWidth) > this.clientWidth + 1
  }

  #refreshToolbarOverflow = () => {
    this.#resetToolbarOverflow()
    this.#compactMenu()

    this.#overflow.style.display = this.#overflowMenu.children.length ? "block" : "none"
    this.#overflow.setAttribute("nonce", getNonce())

    const isOverflowing = this.#overflowMenu.children.length > 0
    this.toggleAttribute("overflowing", isOverflowing)
    this.#overflowMenu.toggleAttribute("disabled", !isOverflowing)
  }

  #compactMenu() {
    const buttons = this.#buttons.reverse()
    let movedToOverflow = false

    for (const button of buttons) {
      if (this.#toolbarIsOverflowing()) {
        this.#overflowMenu.prepend(button)
        movedToOverflow = true
      } else {
        if (movedToOverflow) this.#overflowMenu.prepend(button)
        break
      }
    }
  }

  #resetToolbarOverflow() {
    const items = Array.from(this.#overflowMenu.children)
    items.sort((a, b) => this.#itemPosition(b) - this.#itemPosition(a))

    items.forEach((item) => {
      const nextItem = this.querySelector(`[data-position="${this.#itemPosition(item) + 1}"]`) ?? this.#overflow
      this.insertBefore(item, nextItem)
    })
  }

  #itemPosition(item) {
    return parseInt(item.dataset.position ?? "999")
  }

  #setItemPositionValues() {
    this.#toolbarItems.forEach((item, index) => {
      if (item.dataset.position === undefined) {
        item.dataset.position = index
      }
    })
  }

  #closeDropdowns() {
   this.#dropdowns.forEach((details) => {
     details.open = false
   })
 }

  get #dropdowns() {
    return this.querySelectorAll("details")
  }

  get #overflow() {
    return this.querySelector(".lexxy-editor__toolbar-overflow")
  }

  get #overflowMenu() {
    return this.querySelector(".lexxy-editor__toolbar-overflow-menu")
  }

  get #buttons() {
    return Array.from(this.querySelectorAll(":scope > button"))
  }

  get #focusableItems() {
    return Array.from(this.querySelectorAll(":scope button, :scope > details > summary"))
  }

  get #toolbarItems() {
    return Array.from(this.querySelectorAll(":scope > *:not(.lexxy-editor__toolbar-overflow)"))
  }

  static get defaultTemplate() {
    return `
      <button class="lexxy-editor__toolbar-button" type="button" name="bold" data-command="bold" title="Bold">
        ${ToolbarIcons.bold}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="italic" data-command="italic" title="Italic">
      ${ToolbarIcons.italic}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="strikethrough" data-command="strikethrough" title="Strikethrough">
      ${ToolbarIcons.strikethrough}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="heading" data-command="rotateHeadingFormat" title="Heading">
        ${ToolbarIcons.heading}
      </button>

      <details class="lexxy-editor__toolbar-dropdown" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" name="highlight" title="Color highlight">
          ${ToolbarIcons.highlight}
        </summary>
        <lexxy-highlight-dropdown class="lexxy-editor__toolbar-dropdown-content">
          <div class="lexxy-highlight-colors"></div>
          <button data-command="removeHighlight" class="lexxy-editor__toolbar-button lexxy-editor__toolbar-dropdown-reset">Remove all coloring</button>
        </lexxy-highlight-dropdown>
      </details>

      <details class="lexxy-editor__toolbar-dropdown" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" name="link" title="Link" data-hotkey="cmd+k ctrl+k">
          ${ToolbarIcons.link}
        </summary>
        <lexxy-link-dropdown class="lexxy-editor__toolbar-dropdown-content">
          <form method="dialog">
            <input type="url" placeholder="Enter a URL…" class="input">
            <div class="lexxy-editor__toolbar-dropdown-actions">
              <button type="submit" class="lexxy-editor__toolbar-button" value="link">Link</button>
              <button type="button" class="lexxy-editor__toolbar-button" value="unlink">Unlink</button>
            </div>
          </form>
        </lexxy-link-dropdown>
      </details>

      <button class="lexxy-editor__toolbar-button" type="button" name="quote" data-command="insertQuoteBlock" title="Quote">
        ${ToolbarIcons.quote}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="code" data-command="insertCodeBlock" title="Code">
        ${ToolbarIcons.code}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="unordered-list" data-command="insertUnorderedList" title="Bullet list">
        ${ToolbarIcons.ul}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="ordered-list" data-command="insertOrderedList" title="Numbered list">
        ${ToolbarIcons.ol}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="upload" data-command="uploadAttachments" title="Upload file">
        ${ToolbarIcons.attachment}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="table" data-command="insertTable" title="Insert a table">
        ${ToolbarIcons.table}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="divider" data-command="insertHorizontalDivider" title="Insert a divider">
        ${ToolbarIcons.hr}
      </button>
 
      <div class="lexxy-editor__toolbar-spacer" role="separator"></div>
 
      <button class="lexxy-editor__toolbar-button" type="button" name="undo" data-command="undo" title="Undo">
        ${ToolbarIcons.undo}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="redo" data-command="redo" title="Redo">
        ${ToolbarIcons.redo}
      </button>

      <details class="lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-overflow" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" aria-label="Show more toolbar buttons">${ToolbarIcons.overflow}</summary>
        <div class="lexxy-editor__toolbar-dropdown-content lexxy-editor__toolbar-overflow-menu" aria-label="More toolbar buttons"></div>
      </details>
    `
  }
}

export default LexicalToolbarElement
