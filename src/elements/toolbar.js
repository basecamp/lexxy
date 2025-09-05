import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  $isTextNode
} from "lexical"
import { $isListNode, $isListItemNode } from "@lexical/list"
import { $isQuoteNode, $isHeadingNode } from "@lexical/rich-text"
import { $isCodeNode, $isCodeHighlightNode } from "@lexical/code"
import { $isLinkNode } from "@lexical/link"
import { getListType } from "../helpers/lexical_helper";

export default class LexicalToolbarElement extends HTMLElement {
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

    return [...modifiers, pressedKey].join('+')
  }

  #assignButtonTabindex() {
    const baseTabIndex = parseInt(this.editorElement.editorContentElement.getAttribute("tabindex") ?? "0")
    const buttons = this.querySelectorAll("button")
    buttons.forEach((button, index) => {
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

  static get defaultTemplate() {
    return `
      <button type="button" name="bold" data-command="bold" title="Bold">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path d="m4.1 23c-.5 0-.7-.4-.7-.7v-20.6c0-.4.4-.7.7-.7h8.9c2 0 3.8.6 4.9 1.5 1.2 1 1.8 2.4 1.8 4.1s-.9 3.2-2.3 4.1c-.2 0-.3.3-.3.5s0 .4.3.5c1.9.8 3.2 2.7 3.2 5s-.7 3.6-2.1 4.7-3.3 1.7-5.6 1.7h-8.8zm4.2-18.1v5.1h3c1.2 0 2-.3 2.7-.7.6-.5.9-1.1.9-1.9s-.3-1.4-.8-1.8-1.3-.6-2.3-.6-2.4 0-3.5 0zm0 8.5v5.8h3.7c1.3 0 2.2-.3 2.8-.7s.9-1.2.9-2.2-.4-1.7-1-2.1-1.7-.7-2.9-.7-2.4 0-3.5 0z" fill-rule="evenodd"/> </svg>
      </button>

      <button type="button" name="italic" data-command="italic" title="Italic">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m18.3 1.7c-1.7.4-2.5 1.3-2.7 2.6l-2.4 15.6c-.2 1.1.5 2.1 1.6 2.4.2 0 .2.2.2.3v.7h-.1c0 .1-.2.3-.3.3h-9c-.2 0-.3-.1-.3-.3v-.7h.1c0-.1.1-.2.2-.2 1.7-.4 2.5-1.3 2.7-2.6l2.4-15.6c.2-1.1-.5-2.1-1.6-2.4-.2 0-.2-.2-.2-.3v-.7h.1c0-.1.2-.3.3-.3h9c.2 0 .3.1.3.3v.7h-.1c0 .1-.1.2-.2.2z" fill-rule="evenodd"/></svg>
      </button>

      <button type="button" name="link" title="Link" data-dialog-target="link-dialog" data-hotkey="cmd+k ctrl+k">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m22.2 1.8c-1.1-1.2-2.5-1.8-4.3-1.8s-3.1.6-4.4 1.8l-4.4 4.4c-1.2 1.2-1.8 2.7-1.8 4.3s.6 3.1 1.8 4.3h.2c.2.3.5.4 1 .4.7 0 1.1-.3 1.2-.6.3-.3.4-.7.4-1.1s-.2-.8-.5-1.2c-.5-.5-.8-1.2-.8-1.9s.3-1.4.8-1.9l4.4-4.2c.6-.5 1.5-.8 2.1-.8s1.4.2 1.9.7.8 1.2.8 1.9-.3 1.4-.8 1.9l-2.6 2.2c-.3.3-.5.7-.5 1.2s.2.8.5 1.2c.8.6 1.7.6 2.4 0l2.6-2.2c2.4-2.4 2.4-6.1 0-8.5z"/><path d="m12.3 9.3c-.3.3-.5.8-.5 1.3 0 .4.2.8.5 1.1.5.5.8 1.2.8 1.9s-.3 1.4-.9 1.9l-4.4 4.4c-.4.4-1.2.7-1.8.7s-1.4-.2-1.9-.7-.8-1.2-.8-1.9.3-1.4.8-1.9l2.5-2.4c.7-.7.7-1.7 0-2.4-.8-.6-1.7-.6-2.4 0l-2.5 2.4c-1 1.1-1.7 2.6-1.7 4.2s.6 3.1 1.8 4.3c1.3 1.2 2.7 1.8 4.2 1.8s3.2-.7 4.3-1.8l4.4-4.4c2.4-2.4 2.4-6.1 0-8.6-.8-.6-1.7-.6-2.4 0z"/></svg>
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

      <button type="button" name="quote" data-command="insertQuoteBlock" title="Quote">
        <svg viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg"> <path d="m1.1 5.2c.6-.7 1.4-1.3 2.4-1.4 2.6-.4 4.2.4 5.3 1.9 2 2.3 1.9 5.1.6 7.6-1.3 2.4-4 4.6-7.2 5.1-.4 0-.7-.1-1-.4-.1-.3-.1-.7.3-1.1l1.1-1.1c.3-.4.6-.7.7-1.1s.3-.9 0-1.3c0-.4-.6-.7-1-1-1.2-.8-2.3-2.2-2.3-4.1.1-1.4.4-2.4 1.1-3.1z"/> <path d="m14.6 5.2c.6-.7 1.6-1.1 2.6-1.4 2.4-.4 4.2.4 5.3 1.9 2 2.3 1.9 5.1.6 7.6-1.3 2.4-4 4.6-7.2 5.1-.4 0-.7-.1-1-.4-.1-.3-.1-.7.3-1.1l1.1-1.1c.3-.4.6-.7.7-1.1s.3-.9 0-1.3c-.1-.4-.6-.7-1-1-1.3-.6-2.4-2-2.4-3.9s.4-2.6 1-3.3z"/> </svg>
      </button>

      <button type="button" name="heading" data-command="rotateHeadingFormat" title="Heading">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m5.7 6.2v16.3h3.8v-16.3h5.7v-3.8h-15.2v3.8zm10.1 16.4h3.8v-8.8h4.4v-3.8h-12.6v3.8h4.4z" fill-rule="evenodd"/></svg>
      </button>

      <button type="button" name="code" data-command="insertCodeBlock" title="Code">
        <svg viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg"><path d="m8 4.7c-.6-.6-1.6-.6-2.4 0l-5.1 5.2c-.3.3-.5.7-.5 1.2s.2.9.5 1.2l5.1 5.1c.3.3.7.5 1.2.5s.9-.2 1.2-.5c.6-.6.6-1.7 0-2.4l-4-4 4-4c.6-.6.6-1.7 0-2.4z"/><path d="m23.5 9.9-5.1-5.1c-.6-.6-1.8-.6-2.4 0-.3.3-.5.7-.5 1.2s.2.9.5 1.2l4 4-4 4c-.3.3-.5.7-.5 1.2s.2.9.5 1.2c.3.2.7.4 1.1.4s.9-.2 1.2-.5l5.1-5.1c.3-.3.5-.7.5-1.2s-.2-.9-.5-1.2z"/></svg>
      </button>

      <button type="button" name="unordered-list" data-command="insertUnorderedList" title="Bullet list">
        <svg viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg"> <path d="m2.1 4.8c1.1 0 2.1-.9 2.1-2.1s-1-2-2.1-2-2.1.9-2.1 2.1.9 2 2.1 2zm4.1-2c0-.8.6-1.4 1.4-1.4h15.1c.7 0 1.3.6 1.3 1.4s-.6 1.4-1.4 1.4h-15.1c-.7 0-1.3-.7-1.3-1.4zm1.3 6.8c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4h15.1c.8 0 1.4-.6 1.4-1.4s-.6-1.4-1.4-1.4zm0 8.3c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4h15.1c.8 0 1.4-.6 1.4-1.4s-.6-1.4-1.4-1.4zm-3.4-6.9c0 1.1-.9 2.1-2.1 2.1s-2-1-2-2.1.9-2.1 2.1-2.1 2 1 2 2.1zm-2 10.3c1.1 0 2.1-.9 2.1-2.1s-.9-2.1-2.1-2.1-2.1 1-2.1 2.1.9 2.1 2.1 2.1z" fill-rule="evenodd"/> </svg>
      </button>

      <button type="button" name="ordered-list" data-command="insertOrderedList" title="Numbered list">
        <svg viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg"><path d="m6.7 3c0-.7.6-1.3 1.3-1.3h14.7c.7 0 1.3.6 1.3 1.3s-.6 1.3-1.3 1.3h-14.7c-.7 0-1.3-.6-1.3-1.3zm1.3 6.7c-.7 0-1.3.6-1.3 1.3s.6 1.3 1.3 1.3h14.7c.7 0 1.3-.6 1.3-1.3s-.6-1.3-1.3-1.3zm0 8c-.7 0-1.3.6-1.3 1.3s.6 1.3 1.3 1.3h14.7c.7 0 1.3-.6 1.3-1.3s-.6-1.3-1.3-1.3z" fill-rule="evenodd"/><path d="m1.5 19.6v-.9h.5c.4 0 .8-.3.8-.7s-.3-.7-.8-.7-.8.3-.8.7h-1.2c0-.9.8-1.6 2-1.6s2 .5 2 1.5-.4 1.1-1.1 1.2c.7 0 1.2.7 1.2 1.3 0 1.1-1.1 1.6-2.1 1.6s-2-.8-2-1.6h1.2c0 .4.4.7.8.7s.8-.3.8-.7-.3-.7-.8-.7h-.7.1zm0-9.7h-1.2c0-.9.7-1.7 2-1.7s2 .7 2 1.6-.5 1.2-.9 1.7l-1.1 1.2h2.1v1.1h-3.9v-.8l2-2c.3-.3.5-.7.5-1.1s-.3-.7-.7-.7-.7.3-.7.7h-.3zm1.7-4.4h-1.3v-4.3l-1.2.8v-1.2l1.3-.8h1.3v5.5z"/></svg>
      </button>

      <button type="button" name="upload" data-command="uploadAttachments" title="Upload file">
        <svg viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg"> <path d="m22 20h-20c-1.1 0-2-.9-2-2.1v-15.8c0-1.2.9-2.1 2-2.1h20c1.1 0 2 .9 2 2.1v15.8c0 1.1-.9 2.1-2 2.1zm0-2.9v-14.5c0-.3-.2-.5-.5-.5h-19c-.3 0-.5.2-.5.5v14.5c0 .1.1.2.2.2s.2 0 .2-.1l2.2-3.3c.1-.2.3-.3.5-.3h.7l2.6-4c.1-.2.3-.3.5-.3h.7c.2 0 .4.1.5.3l5.3 8c0 .1.2.2.3.2h.3c.2 0 .4-.2.4-.4s0-.2 0-.2l-1.3-1.9c-.2-.2-.2-.6 0-.8l1.2-1.6c.1-.2.3-.3.5-.3h1.1c.2 0 .4 0 .5.3l3.2 4.4c0 .1.3.2.4 0 .2 0 .2 0 .2-.2zm-5.5-7.6c-1.4 0-2.5-1.2-2.5-2.6s1.1-2.6 2.5-2.6 2.5 1.2 2.5 2.6-1.1 2.6-2.5 2.6z" fill-rule="evenodd"/> </svg>
      </button>

      <details class="lexxy-editor__toolbar-overflow">
        <summary aria-label="Show more toolbar buttons">•••</summary>
        <div class="lexxy-editor__toolbar-overflow-menu" aria-label="More toolbar buttons"></div>
      </details>
    `
  }
}

customElements.define("lexxy-toolbar", LexicalToolbarElement)
