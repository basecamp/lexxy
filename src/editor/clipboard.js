import { marked } from "marked"
import { isUrl } from "../helpers/string_helper"
import { nextFrame } from "../helpers/timing_helpers"
import { dispatch } from "../helpers/html_helper"
import { $isCodeNode } from "@lexical/code"
import { $getSelection, $isRangeSelection, PASTE_TAG } from "lexical"
import { $insertDataTransferForRichText } from "@lexical/clipboard"

export default class Clipboard {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
  }

  paste(event) {
    const clipboardData = event.clipboardData

    if (!clipboardData) return false

    const paster = Paster.for(clipboardData, this.editorElement)
    if (paster?.paste()) {
      event.preventDefault()
      return true
    }
  }

  #isPastingIntoCodeBlock() {
    let result = false

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      let currentNode = selection.anchor.getNode()

      while (currentNode) {
        if ($isCodeNode(currentNode)) {
          result = true
          return
        }
        currentNode = currentNode.getParent()
      }
    })

    return result
  }
}

class Paster {
  static for(clipboardData, editorElement) {
    return new Paster(clipboardData, editorElement)
  }

  constructor(clipboardData, editorElement) {
    this.clipboardData = clipboardData

    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.contents = editorElement.contents
  }

  paste() {
    if (this.#isPlainTextOrURLPasted()) {
      this.#pastePlainText()
      return true
    }

    return this.#handlePastedFiles()
  }

  #isPlainTextOrURLPasted() {
    return this.#isOnlyPlainTextPasted() || this.#isOnlyURLPasted()
  }

  #isOnlyPlainTextPasted() {
    const types = Array.from(this.clipboardData.types)
    return types.length === 1 && types[0] === "text/plain"
  }

  #isOnlyURLPasted() {
    // Safari URLs are copied as a text/plain + text/uri-list object
    const types = Array.from(this.clipboardData.types)
    return types.length === 2 && types.includes("text/uri-list") && types.includes("text/plain")
  }


  #pastePlainText() {
    const item = this.clipboardData.items[0]
    item.getAsString((text) => {
      if (isUrl(text) && this.contents.hasSelectedText()) {
        this.contents.createLinkWithSelectedText(text)
      } else if (isUrl(text)) {
        const nodeKey = this.contents.createLink(text)
        this.#dispatchLinkInsertEvent(nodeKey, { url: text })
      } else if (this.editorElement.supportsMarkdown) {
        this.#pasteMarkdown(text)
      } else {
        this.#pasteRichText()
      }
    })
  }

  #dispatchLinkInsertEvent(nodeKey, payload) {
    const linkManipulationMethods = {
      replaceLinkWith: (html, options) => this.contents.replaceNodeWithHTML(nodeKey, html, options),
      insertBelowLink: (html, options) => this.contents.insertHTMLBelowNode(nodeKey, html, options)
    }

    dispatch(this.editorElement, "lexxy:insert-link", {
      ...payload,
      ...linkManipulationMethods
    })
  }

  #pasteMarkdown(text) {
    const html = marked(text)
    this.contents.insertHtml(html, { tag: PASTE_TAG })
  }

  #pasteRichText() {
    this.editor.update(() => {
      const selection = $getSelection()
      $insertDataTransferForRichText(this.clipboardData, selection, this.editor)
    }, { tag: PASTE_TAG })
  }

  #handlePastedFiles() {
    if (!this.editorElement.supportsAttachments) return

    const html = clipboardData.getData("text/html")
    if (html) return // Ignore if image copied from browser since we will load it as a remote image

    this.#preservingScrollPosition(() => {
      for (const item of clipboardData.items) {
        const file = item.getAsFile()
        if (!file) continue

        this.contents.uploadFile(file)
      }
    })
  }

  // Deals with an issue in Safari where it scrolls to the tops after pasting attachments
  async #preservingScrollPosition(callback) {
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    callback()

    await nextFrame()

    window.scrollTo(scrollX, scrollY)
    this.editor.focus()
  }
}
