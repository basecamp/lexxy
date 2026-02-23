import { Marked } from "marked"
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
    this.contents = editorElement.contents
  }

  paste(event) {
    const clipboardData = event.clipboardData

    if (!clipboardData) return false

    if (this.#isPlainTextOrURLPasted(clipboardData) && !this.#isPastingIntoCodeBlock()) {
      this.#pastePlainText(clipboardData)
      event.preventDefault()
      return true
    }

    this.#handlePastedFiles(clipboardData)
  }

  #isPlainTextOrURLPasted(clipboardData) {
    return this.#isOnlyPlainTextPasted(clipboardData) || this.#isOnlyURLPasted(clipboardData)
  }

  #isOnlyPlainTextPasted(clipboardData) {
    const types = Array.from(clipboardData.types)
    return types.length === 1 && types[0] === "text/plain"
  }

  #isOnlyURLPasted(clipboardData) {
    // Safari URLs are copied as a text/plain + text/uri-list object
    const types = Array.from(clipboardData.types)
    return types.length === 2 && types.includes("text/uri-list") && types.includes("text/plain")
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

  #pastePlainText(clipboardData) {
    const item = clipboardData.items[0]
    item.getAsString((text) => {
      if (isUrl(text) && this.contents.hasSelectedText()) {
        this.contents.createLinkWithSelectedText(text)
      } else if (isUrl(text)) {
        const nodeKey = this.contents.createLink(text)
        this.#dispatchLinkInsertEvent(nodeKey, { url: text })
      } else if (this.editorElement.supportsMarkdown) {
        this.#pasteMarkdown(text)
      } else {
        this.#pasteRichText(clipboardData)
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
    console.log("markdown")
    const html = this.#marked.parse(text)
    this.contents.insertHtml(html, { tag: [ PASTE_TAG ] })
  }

  get #marked() {
    return new Marked({
      breaks: true,
      renderer: {
        space({ raw }) {
          const extraLines = raw.length - 1
          if (extraLines <= 0) return ""
          return "<p><br></p>".repeat(extraLines)
        }
      }
    })
  }

  #pasteRichText(clipboardData) {
    this.editor.update(() => {
      const selection = $getSelection()
      $insertDataTransferForRichText(clipboardData, selection, this.editor)
    }, { tag: PASTE_TAG })
  }

  #handlePastedFiles(clipboardData) {
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
