import {
  $addUpdateTag,
  $getSelection,
  $isRangeSelection,
  SKIP_DOM_SELECTION_TAG
} from "lexical"
import { getNonce } from "../helpers/csp_helper"
import { $isListItemNode, $isListNode } from "@lexical/list"
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { $isCodeNode } from "@lexical/code"
import { $isLinkNode } from "@lexical/link"
import { $getTableCellNodeFromLexicalNode } from "@lexical/table"
import { getListType } from "../helpers/lexical_helper"
import { isSelectionHighlighted } from "../helpers/format_helper"
import { handleRollingTabIndex } from "../helpers/accessibility_helper"

export default class LexicalToolbarElement extends HTMLElement {
  static observedAttributes = [ "connected" ]

  constructor() {
    super()
    this.internals = this.attachInternals()
    this.internals.role = "toolbar"
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
    this.#bindButtons()
    this.#bindHotkeys()
    this.#resetTabIndexValues()
    this.#setItemPositionValues()
    this.#monitorSelectionChanges()
    this.#monitorHistoryChanges()
    this.#refreshToolbarOverflow()
    this.#bindFocusListeners()

    this.toggleAttribute("connected", true)
  }

  #reconnect() {
    this.disconnectedCallback()
    this.connectedCallback()
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

  #dispatchButtonCommand(event, { dataset: { command, payload }}) {
    const isKeyboard = event instanceof PointerEvent && event.pointerId === -1

    this.editor.update(() => {
      this.editor.dispatchCommand(command, payload)
    }, { tag: isKeyboard ? SKIP_DOM_SELECTION_TAG : undefined } )
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
    this.editorElement.addEventListener("lexxy:focus", this.#handleFocus)
    this.editorElement.addEventListener("lexxy:blur", this.#handleFocusOut)
    this.addEventListener("focusout", this.#handleFocusOut)
    this.addEventListener("keydown", this.#handleKeydown)
  }

  #unbindFocusListeners() {
    this.editorElement.removeEventListener("lexxy:focus", this.#handleFocus)
    this.editorElement.removeEventListener("lexxy:blur", this.#handleFocusOut)
    this.removeEventListener("focusout", this.#handleFocusOut)
    this.removeEventListener("keydown", this.#handleKeydown)
  }

  #handleFocus = () => {
    this.#resetTabIndexValues()
    this.#focusableItems[0].tabIndex = 0
  }

  #handleFocusOut = () => {
    if (!this.contains(document.activeElement)) {
      this.#resetTabIndexValues()
    }
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

    const topLevelElement = anchorNode.getTopLevelElementOrThrow()

    const isBold = selection.hasFormat("bold")
    const isItalic = selection.hasFormat("italic")
    const isStrikethrough = selection.hasFormat("strikethrough")
    const isHighlight = isSelectionHighlighted(selection)
    const isInLink = this.#isInLink(anchorNode)
    const isInQuote = $isQuoteNode(topLevelElement)
    const isInHeading = $isHeadingNode(topLevelElement)
    const isInCode = $isCodeNode(topLevelElement) || selection.hasFormat("code")
    const isInList = this.#isInList(anchorNode)
    const listType = getListType(anchorNode)
    const isInTable = $getTableCellNodeFromLexicalNode(anchorNode) !== null

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

  #isInList(node) {
    let current = node
    while (current) {
      if ($isListNode(current) || $isListItemNode(current)) return true
      current = current.getParent()
    }
    return false
  }

  #isInLink(node) {
    let current = node
    while (current) {
      if ($isLinkNode(current)) return true
      current = current.getParent()
    }
    return false
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
    return this.scrollWidth > this.clientWidth
  }

  #refreshToolbarOverflow = () => {
    this.#resetToolbar()
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

  #resetToolbar() {
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
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 22V2h8.183c1.764 0 3.174.435 4.228 1.304 1.055.87 1.582 2.076 1.582 3.62 0 .8-.148 1.503-.445 2.109a3.94 3.94 0 01-1.194 1.465 4.866 4.866 0 01-1.726.806v.176c.786.078 1.51.312 2.172.703a4.293 4.293 0 011.596 1.627c.403.693.604 1.543.604 2.549 0 1.192-.292 2.207-.877 3.048-.585.84-1.39 1.484-2.416 1.934-1.026.44-2.206.659-3.538.659H5zM8.854 4.974v5.348h2.56c.873 0 1.582-.107 2.129-.322.556-.215.963-.523 1.222-.923.269-.41.403-.904.403-1.48 0-.82-.254-1.46-.762-1.92-.499-.468-1.204-.703-2.115-.703H8.854zm0 8.103v5.949h2.877c1.534 0 2.636-.245 3.307-.733.671-.498 1.007-1.221 1.007-2.168 0-.635-.134-1.178-.403-1.627-.268-.459-.666-.81-1.193-1.055-.518-.244-1.156-.366-1.913-.366H8.854z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="italic" data-command="italic" title="Italic">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.1 4h-1.5l-3.2 16h1.5l-.4 2h-7l.4-2h1.5l3.2-16h-1.5l.4-2h7l-.4 2z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="strikethrough" data-command="strikethrough" title="Strikethrough">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M4.70588 16.1591C4.81459 19.7901 7.48035 22 11.6668 22C15.9854 22 18.724 19.6296 18.724 15.8779C18.724 15.5007 18.6993 15.1427 18.6474 14.8066H14.3721C14.8637 15.2085 15.0799 15.7037 15.0799 16.3471C15.0799 17.7668 13.7532 18.7984 11.8113 18.7984C9.88053 18.7984 8.38582 17.7531 8.21659 16.1591H4.70588ZM5.23953 9.31962H9.88794C9.10723 8.88889 8.75888 8.33882 8.75888 7.57339C8.75888 6.13992 9.96576 5.18793 11.7631 5.18793C13.5852 5.18793 14.8761 6.1797 14.9959 7.81344H18.4102C18.3485 4.31824 15.8038 2 11.752 2C7.867 2 5.09129 4.35802 5.09129 7.92044C5.09129 8.41838 5.14071 8.88477 5.23953 9.31962ZM2.23529 10.6914C1.90767 10.6914 1.59347 10.8359 1.36181 11.0931C1.13015 11.3504 1 11.6993 1 12.0631C1 12.4269 1.13015 12.7758 1.36181 13.0331C1.59347 13.2903 1.90767 13.4348 2.23529 13.4348H20.7647C21.0923 13.4348 21.4065 13.2903 21.6382 13.0331C21.8699 12.7758 22 12.4269 22 12.0631C22 11.6993 21.8699 11.3504 21.6382 11.0931C21.4065 10.8359 21.0923 10.6914 20.7647 10.6914H2.23529Z"/>
        </svg>
      </button>

      <details class="lexxy-editor__toolbar-dropdown" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" name="highlight" title="Color highlight">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.65422 0.711575C7.1856 0.242951 6.42579 0.242951 5.95717 0.711575C5.48853 1.18021 5.48853 1.94 5.95717 2.40864L8.70864 5.16011L2.85422 11.0145C1.44834 12.4204 1.44833 14.6998 2.85422 16.1057L7.86011 21.1115C9.26599 22.5174 11.5454 22.5174 12.9513 21.1115L19.6542 14.4087C20.1228 13.94 20.1228 13.1802 19.6542 12.7115L11.8544 4.91171L11.2542 4.31158L7.65422 0.711575ZM4.55127 12.7115L10.4057 6.85716L17.1087 13.56H4.19981C4.19981 13.253 4.31696 12.9459 4.55127 12.7115ZM23.6057 20.76C23.6057 22.0856 22.5311 23.16 21.2057 23.16C19.8802 23.16 18.8057 22.0856 18.8057 20.76C18.8057 19.5408 19.8212 18.5339 20.918 17.4462C21.0135 17.3516 21.1096 17.2563 21.2057 17.16C21.3018 17.2563 21.398 17.3516 21.4935 17.4462C22.5903 18.5339 23.6057 19.5408 23.6057 20.76Z"/></svg>
        </summary>
        <lexxy-highlight-dropdown class="lexxy-editor__toolbar-dropdown-content">
          <div data-button-group="color" data-values="var(--highlight-1); var(--highlight-2); var(--highlight-3); var(--highlight-4); var(--highlight-5); var(--highlight-6); var(--highlight-7); var(--highlight-8); var(--highlight-9)"></div>
          <div data-button-group="background-color" data-values="var(--highlight-bg-1); var(--highlight-bg-2); var(--highlight-bg-3); var(--highlight-bg-4); var(--highlight-bg-5); var(--highlight-bg-6); var(--highlight-bg-7); var(--highlight-bg-8); var(--highlight-bg-9)"></div>
          <button data-command="removeHighlight" class="lexxy-editor__toolbar-dropdown-reset">Remove all coloring</button>
        </lexxy-highlight-dropdown>
      </details>

      <details class="lexxy-editor__toolbar-dropdown" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" name="link" title="Link" data-hotkey="cmd+k ctrl+k">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.111 9.546a1.5 1.5 0 012.121 0 5.5 5.5 0 010 7.778l-2.828 2.828a5.5 5.5 0 01-7.778 0 5.498 5.498 0 010-7.777l2.828-2.83a1.5 1.5 0 01.355-.262 6.52 6.52 0 00.351 3.799l-1.413 1.414a2.499 2.499 0 000 3.535 2.499 2.499 0 003.535 0l2.83-2.828a2.5 2.5 0 000-3.536 1.5 1.5 0 010-2.121z"/><path d="M12.111 3.89a5.5 5.5 0 117.778 7.777l-2.828 2.829a1.496 1.496 0 01-.355.262 6.522 6.522 0 00-.351-3.8l1.413-1.412a2.5 2.5 0 10-3.536-3.535l-2.828 2.828a2.5 2.5 0 000 3.536 1.5 1.5 0 01-2.122 2.12 5.5 5.5 0 010-7.777l2.83-2.829z"/></svg>
        </summary>
        <lexxy-link-dropdown class="lexxy-editor__toolbar-dropdown-content">
          <form method="dialog">
            <input type="url" placeholder="Enter a URL…" class="input">
            <div class="lexxy-editor__toolbar-dropdown-actions">
              <button type="submit" class="btn" value="link">Link</button>
              <button type="button" class="btn" value="unlink">Unlink</button>
            </div>
          </form>
        </lexxy-link-dropdown>
      </details>

      <button class="lexxy-editor__toolbar-button" type="button" name="quote" data-command="insertQuoteBlock" title="Quote">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 5C8.985 5 11 7.09 11 9.667c0 2.694-.962 5.005-2.187 6.644-.613.82-1.3 1.481-1.978 1.943-.668.454-1.375.746-2.022.746a.563.563 0 01-.52-.36.602.602 0 01.067-.57l.055-.066.009-.009.041-.048a4.25 4.25 0 00.168-.21c.143-.188.336-.47.53-.84a6.743 6.743 0 00.75-2.605C3.705 13.994 2 12.038 2 9.667 2 7.089 4.015 5 6.5 5zM17.5 5C19.985 5 22 7.09 22 9.667c0 2.694-.962 5.005-2.187 6.644-.613.82-1.3 1.481-1.978 1.943-.668.454-1.375.746-2.023.746a.563.563 0 01-.52-.36.602.602 0 01.068-.57l.055-.066.009-.009.041-.048c.039-.045.097-.115.168-.21a6.16 6.16 0 00.53-.84 6.745 6.745 0 00.75-2.605C14.705 13.994 13 12.038 13 9.667 13 7.089 15.015 5 17.5 5z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="heading" data-command="rotateHeadingFormat" title="Heading">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.322 5.315H9.64V22H5.684V5.315H0v-3.31h15.322v3.31z"/><path d="M23.957 11.79H19.92V22h-3.402V11.79H12.48V9.137h11.477v2.653z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="code" data-command="insertCodeBlock" title="Code">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10.121 6l-6 6 6 6-2.12 2.121-7.061-7.06a1.5 1.5 0 010-2.121L8 3.879 10.121 6zM23.06 10.94a1.5 1.5 0 010 2.12L16 20.121 13.88 18l6-6-6-6L16 3.879l7.06 7.06z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="unordered-list" data-command="insertUnorderedList" title="Bullet list">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 5a2 2 0 11-4 0 2 2 0 014 0zM5 12a2 2 0 11-4 0 2 2 0 014 0zM5 19a2 2 0 11-4 0 2 2 0 014 0zM7 5.25C7 4.56 7.56 4 8.25 4h13.5a1.25 1.25 0 110 2.5H8.25C7.56 6.5 7 5.94 7 5.25zM7 12.25c0-.69.56-1.25 1.25-1.25h13.5a1.25 1.25 0 110 2.5H8.25c-.69 0-1.25-.56-1.25-1.25zM7 19.25c0-.69.56-1.25 1.25-1.25h13.5a1.25 1.25 0 110 2.5H8.25c-.69 0-1.25-.56-1.25-1.25z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="ordered-list" data-command="insertOrderedList" title="Numbered list">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 5.25C7 4.56 7.56 4 8.25 4h13.5a1.25 1.25 0 110 2.5H8.25C7.56 6.5 7 5.94 7 5.25zM7 12.25c0-.69.56-1.25 1.25-1.25h13.5a1.25 1.25 0 110 2.5H8.25c-.69 0-1.25-.56-1.25-1.25zM7 19.25c0-.69.56-1.25 1.25-1.25h13.5a1.25 1.25 0 110 2.5H8.25c-.69 0-1.25-.56-1.25-1.25zM4.438 8H3.39V3.684H3.34c-.133.093-.267.188-.402.285l-.407.289a129.5 129.5 0 00-.402.285v-.969l.633-.453c.21-.15.42-.302.629-.453h1.046V8zM2.672 11.258h-1v-.051c0-.206.036-.405.11-.598.075-.195.188-.37.34-.527.15-.156.339-.281.566-.375.229-.094.498-.14.808-.14.367 0 .688.065.961.195s.484.308.633.535c.15.224.226.478.226.762 0 .244-.046.463-.14.656-.091.19-.209.368-.352.535-.14.164-.289.332-.445.504L3.168 14.09v.05h2.238V15H1.723v-.656l1.949-2.102c.096-.101.19-.207.281-.316.091-.112.167-.232.227-.36a.953.953 0 00.09-.41.712.712 0 00-.387-.648.845.845 0 00-.41-.098.81.81 0 00-.43.11.75.75 0 00-.277.293.824.824 0 00-.094.386V11.258zM2.852 19.66v-.812h.562a.917.917 0 00.43-.098.742.742 0 00.293-.266.673.673 0 00.101-.379.654.654 0 00-.234-.523.87.87 0 00-.59-.2.987.987 0 00-.336.055.837.837 0 00-.258.149.712.712 0 00-.172.215.66.66 0 00-.066.25h-.98c.007-.209.053-.403.136-.582.084-.18.203-.336.36-.469.156-.135.346-.24.57-.316.227-.076.486-.115.777-.118a2.33 2.33 0 01.965.176c.271.12.48.285.63.496.15.209.227.448.23.719a1.11 1.11 0 01-.16.637 1.28 1.28 0 01-.825.586v.054c.162.016.33.07.504.164.177.094.328.232.453.415.125.18.189.411.192.695a1.37 1.37 0 01-.157.676c-.104.197-.25.365-.437.503-.188.136-.404.24-.649.313-.242.07-.5.105-.777.105-.401 0-.743-.067-1.027-.203a1.608 1.608 0 01-.649-.547 1.46 1.46 0 01-.238-.75h.969c.01.128.057.243.14.344a.885.885 0 00.332.238c.141.058.3.088.477.09.195 0 .366-.034.512-.101a.798.798 0 00.336-.29.744.744 0 00.117-.425.74.74 0 00-.446-.695 1.082 1.082 0 00-.496-.106h-.59z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="upload" data-command="uploadAttachments" title="Upload file">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 8a2 2 0 110 4 2 2 0 010-4z""/><path d="M22 2a1 1 0 011 1v18a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h20zM3 18.714L9 11l5.25 6.75L17 15l4 4V4H3v14.714z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="table" data-command="insertTable" title="Insert a table">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.2041 2.01074C21.2128 2.113 22 2.96435 22 4V20L21.9893 20.2041C21.8938 21.1457 21.1457 21.8938 20.2041 21.9893L20 22H4C2.96435 22 2.113 21.2128 2.01074 20.2041L2 20V4C2 2.89543 2.89543 2 4 2H20L20.2041 2.01074ZM4 13V20H11V13H4ZM13 13V20H20V13H13ZM4 11H11V4H4V11ZM13 11H20V4H13V11Z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="divider" data-command="insertHorizontalDivider" title="Insert a divider">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 12C0 11.4477 0.447715 11 1 11H23C23.5523 11 24 11.4477 24 12C24 12.5523 23.5523 13 23 13H1C0.447716 13 0 12.5523 0 12Z"/><path d="M4 5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5C20 6.10457 19.1046 7 18 7H6C4.89543 7 4 6.10457 4 5Z"/><path d="M4 19C4 17.8954 4.89543 17 6 17H18C19.1046 17 20 17.8954 20 19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19Z"/></svg>
      </button>
 
      <div class="lexxy-editor__toolbar-spacer" role="separator"></div>
 
      <button class="lexxy-editor__toolbar-button" type="button" name="undo" data-command="undo" title="Undo" data-hotkey="cmd+z ctrl+z">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5.64648 8.26531C7.93911 6.56386 10.7827 5.77629 13.624 6.05535C16.4655 6.33452 19.1018 7.66079 21.0195 9.77605C22.5839 11.5016 23.5799 13.6516 23.8936 15.9352C24.0115 16.7939 23.2974 17.4997 22.4307 17.4997C21.5641 17.4997 20.8766 16.7915 20.7148 15.9401C20.4295 14.4379 19.7348 13.0321 18.6943 11.8844C17.3 10.3464 15.3835 9.38139 13.3174 9.17839C11.2514 8.97546 9.18359 9.54856 7.5166 10.7858C6.38259 11.6275 5.48981 12.7361 4.90723 13.9997H8.5C9.3283 13.9997 9.99979 14.6714 10 15.4997C10 16.3281 9.32843 16.9997 8.5 16.9997H1.5C0.671573 16.9997 0 16.3281 0 15.4997V8.49968C0.000213656 7.67144 0.671705 6.99968 1.5 6.99968C2.3283 6.99968 2.99979 7.67144 3 8.49968V11.0212C3.7166 9.9704 4.60793 9.03613 5.64648 8.26531Z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="redo" data-command="redo" title="Redo" data-hotkey="cmd+shift+z ctrl+shift+z ctrl+y">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.2599 8.26531C15.9672 6.56386 13.1237 5.77629 10.2823 6.05535C7.4408 6.33452 4.80455 7.66079 2.88681 9.77605C1.32245 11.5016 0.326407 13.6516 0.0127834 15.9352C-0.105117 16.7939 0.608975 17.4997 1.47567 17.4997C2.34228 17.4997 3.02969 16.7915 3.19149 15.9401C3.47682 14.4379 4.17156 13.0321 5.212 11.8844C6.60637 10.3464 8.52287 9.38139 10.589 9.17839C12.655 8.97546 14.7227 9.54856 16.3897 10.7858C17.5237 11.6275 18.4165 12.7361 18.9991 13.9997H15.4063C14.578 13.9997 13.9066 14.6714 13.9063 15.4997C13.9063 16.3281 14.5779 16.9997 15.4063 16.9997H22.4063C23.2348 16.9997 23.9063 16.3281 23.9063 15.4997V8.49968C23.9061 7.67144 23.2346 6.99968 22.4063 6.99968C21.578 6.99968 20.9066 7.67144 20.9063 8.49968V11.0212C20.1897 9.9704 19.2984 9.03613 18.2599 8.26531Z"/></svg>
      </button>

      <details class="lexxy-editor__toolbar-overflow">
        <summary class="lexxy-editor__toolbar-button" aria-label="Show more toolbar buttons">•••</summary>
        <div class="lexxy-editor__toolbar-overflow-menu" aria-label="More toolbar buttons"></div>
      </details>
    `
  }
}

customElements.define("lexxy-toolbar", LexicalToolbarElement)
