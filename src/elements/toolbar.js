import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  $isTextNode
} from "lexical"
import { getNonce } from "../helpers/csp_helper"
import { $isListNode, $isListItemNode } from "@lexical/list"
import { $isQuoteNode, $isHeadingNode } from "@lexical/rich-text"
import { $isCodeNode, $isCodeHighlightNode } from "@lexical/code"
import { $isLinkNode } from "@lexical/link"
import { getListType } from "../helpers/lexical_helper";

export default class LexicalToolbarElement extends HTMLElement {
  constructor() {
    super()
    this.internals = this.attachInternals()
    this.internals.role = "toolbar"
  }

  connectedCallback() {
    this.#refreshToolbarOverflow()
    window.addEventListener("resize", this.#refreshToolbarOverflow)
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.#refreshToolbarOverflow)
  }

  setEditor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.#bindButtons()
    this.#bindHotkeys()
    this.#assignButtonTabindex()
    this.#monitorSelectionChanges()
  }

  #bindButtons() {
    this.addEventListener("click", this.#handleButtonClicked.bind(this))
  }

  #handleButtonClicked({ target }) {
    this.#handleTargetClicked(target, "[data-command]", this.#dispatchButtonCommand.bind(this))
    this.#handleTargetClicked(target, "[data-dialog-target]", this.#toggleDialog.bind(this))
  }

  #handleTargetClicked(target, selector, callback) {
    const button = target.closest(selector)
    if (button) {
      callback(button)
    }
  }

  #dispatchButtonCommand(button) {
    const { command, payload } = button.dataset
    this.editor.dispatchCommand(command, payload)
  }

  // Not using popover because of CSS anchoring still not widely available.
  #toggleDialog(button) {
    const dialog = document.getElementById(button.dataset.dialogTarget).parentNode

    if (dialog.open) {
      dialog.close()
    } else {
      dialog.show()
    }
  }

  #bindHotkeys() {
    this.editorElement.addEventListener('keydown', (event) => {
      const buttons = this.querySelectorAll("[data-hotkey]")
      buttons.forEach((button) => {
        const hotkeys = button.dataset.hotkey.toLowerCase().split(/\s+/)
        if (hotkeys.includes(this.#keyCombinationFor(event))) {
          event.preventDefault()
          event.stopPropagation()
          button.click()
        }
      })
    })
  }

  #keyCombinationFor(event) {
    const pressedKey = event.key.toLowerCase()
    const modifiers = [
      event.ctrlKey ? 'ctrl' : null,
      event.metaKey ? 'cmd' : null,
      event.altKey ? 'alt' : null,
      event.shiftKey ? 'shift' : null,
    ].filter(Boolean)

    return [ ...modifiers, pressedKey ].join('+')
  }

  #assignButtonTabindex() {
    const baseTabIndex = parseInt(this.editorElement.editorContentElement.getAttribute("tabindex") ?? "0")
    this.#buttons.forEach((button, index) => {
      button.setAttribute("tabindex", `${baseTabIndex + index + 1}`)
    })
  }

  #monitorSelectionChanges() {
    this.editor.registerUpdateListener(() => {
      this.editor.getEditorState().read(() => {
        this.#updateButtonStates()
      })
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
    const isInCode = $isCodeNode(topLevelElement) || selection.hasFormat("code")
    const isInList = this.#isInList(anchorNode)
    const listType = getListType(anchorNode)
    const isInQuote = $isQuoteNode(topLevelElement)
    const isInHeading = $isHeadingNode(topLevelElement)
    const isInLink = this.#isInLink(anchorNode)

    this.#setButtonPressed("bold", isBold)
    this.#setButtonPressed("italic", isItalic)
    this.#setButtonPressed("code", isInCode)
    this.#setButtonPressed("unordered-list", isInList && listType === "bullet")
    this.#setButtonPressed("ordered-list", isInList && listType === "number")
    this.#setButtonPressed("quote", isInQuote)
    this.#setButtonPressed("heading", isInHeading)
    this.#setButtonPressed("link", isInLink)
  }

  #isSelectionInInlineCode(selection) {
    const nodes = selection.getNodes()
    return nodes.some(node => {
      if ($isCodeHighlightNode(node)) return true
      // Check parent for text nodes inside code highlight
      if ($isTextNode(node)) {
        const parent = node.getParent()
        if (parent && $isCodeHighlightNode(parent)) return true
      }
      return false
    })
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

  #toolbarIsOverflowing() {
    return this.scrollWidth > this.clientWidth
  }

  #refreshToolbarOverflow = () => {
    this.#resetToolbar()
    this.#compactMenu()

    this.#overflow.style.display = this.#overflowMenu.children.length ? "block" : "none"
    this.#overflow.setAttribute("nonce", getNonce())
  }

  get #overflow() {
    return this.querySelector(".lexxy-editor__toolbar-overflow")
  }

  get #overflowMenu() {
    return this.querySelector(".lexxy-editor__toolbar-overflow-menu")
  }

  #resetToolbar() {
    while (this.#overflowMenu.children.length > 0) {
      this.insertBefore(this.#overflowMenu.children[0], this.#overflow);
    }
  }

  #compactMenu() {
    const buttons = this.#buttons.reverse()
    let movedToOverflow = false

    for (const button of buttons) {
      if (this.#toolbarIsOverflowing()) {
        this.#overflowMenu.appendChild(button)
        movedToOverflow = true
      } else {
        if (movedToOverflow) this.#overflowMenu.appendChild(button)
        break
      }
    }
  }

  get #buttons() {
    return Array.from(this.querySelectorAll(":scope > button"))
  }

  static get defaultTemplate() {
    return `
      <button class="lexxy-editor__toolbar-button" type="button" name="bold" data-command="bold" title="Bold">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 22V2h8.183c1.764 0 3.174.435 4.228 1.304 1.055.87 1.582 2.076 1.582 3.62 0 .8-.148 1.503-.445 2.109a3.94 3.94 0 01-1.194 1.465 4.866 4.866 0 01-1.726.806v.176c.786.078 1.51.312 2.172.703a4.293 4.293 0 011.596 1.627c.403.693.604 1.543.604 2.549 0 1.192-.292 2.207-.877 3.048-.585.84-1.39 1.484-2.416 1.934-1.026.44-2.206.659-3.538.659H5zM8.854 4.974v5.348h2.56c.873 0 1.582-.107 2.129-.322.556-.215.963-.523 1.222-.923.269-.41.403-.904.403-1.48 0-.82-.254-1.46-.762-1.92-.499-.468-1.204-.703-2.115-.703H8.854zm0 8.103v5.949h2.877c1.534 0 2.636-.245 3.307-.733.671-.498 1.007-1.221 1.007-2.168 0-.635-.134-1.178-.403-1.627-.268-.459-.666-.81-1.193-1.055-.518-.244-1.156-.366-1.913-.366H8.854z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="italic" data-command="italic" title="Italic">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.1 4h-1.5l-3.2 16h1.5l-.4 2h-7l.4-2h1.5l3.2-16h-1.5l.4-2h7l-.4 2z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="link" title="Link" data-dialog-target="link-dialog" data-hotkey="cmd+k ctrl+k">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.111 9.546a1.5 1.5 0 012.121 0 5.5 5.5 0 010 7.778l-2.828 2.828a5.5 5.5 0 01-7.778 0 5.498 5.498 0 010-7.777l2.828-2.83a1.5 1.5 0 01.355-.262 6.52 6.52 0 00.351 3.799l-1.413 1.414a2.499 2.499 0 000 3.535 2.499 2.499 0 003.535 0l2.83-2.828a2.5 2.5 0 000-3.536 1.5 1.5 0 010-2.121z"/><path d="M12.111 3.89a5.5 5.5 0 117.778 7.777l-2.828 2.829a1.496 1.496 0 01-.355.262 6.522 6.522 0 00-.351-3.8l1.413-1.412a2.5 2.5 0 10-3.536-3.535l-2.828 2.828a2.5 2.5 0 000 3.536 1.5 1.5 0 01-2.122 2.12 5.5 5.5 0 010-7.777l2.83-2.829z"/></svg>
      </button>

      <lexxy-link-dialog class="lexxy-link-dialog">
        <dialog id="link-dialog" closedby="any">
          <form method="dialog">
            <input type="url" placeholder="Enter a URL…" class="input" required>
            <div class="lexxy-dialog-actions">
              <button type="submit" class="btn" value="link">Link</button>
              <button type="button" class="btn" value="unlink">Unlink</button>
            </div>
          </form>
        </dialog>
      </lexxy-link-dialog>

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

      <details class="lexxy-editor__toolbar-overflow">
        <summary class="lexxy-editor__toolbar-button" aria-label="Show more toolbar buttons">•••</summary>
        <div class="lexxy-editor__toolbar-overflow-menu" aria-label="More toolbar buttons"></div>
      </details>
    `
  }
}

customElements.define("lexxy-toolbar", LexicalToolbarElement)
