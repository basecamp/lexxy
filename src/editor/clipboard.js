import { marked } from "marked"
import { isUrl } from "../helpers/string_helper";
import { nextFrame } from "../helpers/timing_helpers";
import { dispatch } from "./html_helper"

export default class Clipboard {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.contents = editorElement.contents
  }

  paste(event) {
    const clipboardData = event.clipboardData

    if (!clipboardData) return false

    if (this.#isOnlyPlainTextPasted(clipboardData)) {
      this.#pastePlainText(clipboardData)
      event.preventDefault()
      return true
    }

    this.#handlePastedFiles(clipboardData)
  }

  #isOnlyPlainTextPasted(clipboardData) {
    const types = Array.from(clipboardData.types)
    return types.length === 1 && types[0] === "text/plain"
  }

  #pastePlainText(clipboardData) {
    const item = clipboardData.items[0]
    item.getAsString((text) => {
      if (isUrl(text) && this.contents.hasSelectedText()) {
        this.contents.createLinkWithSelectedText(text)
      } else if (isUrl(text)) {
        const nodeKey = this.contents.createLink(text)
        this.#dispatchLinkEvent("created", this.editorElement, nodeKey, { url: text })
      } else {
        this.#pasteMarkdown(text)
      }
    })
  }

  #dispatchLinkCreatedEvent(nodeKey, payload) {
    const linkManipulationMethods = {
      replaceLinkWith: (html, options) => this.contents.replaceNodeWithHTML(nodeKey, html, options),
      insertBelowLink: (html, options) => this.contents.insertHTMLBelowNode(nodeKey, html, options)
    }

    dispatch(this.editorElement, "lexxy:link-created", {
      ...payload,
      ...linkManipulationMethods
    })
  }

  #pasteMarkdown(text) {
    const html = marked(text)
    this.contents.insertHtml(html)
  }

  #handlePastedFiles(clipboardData) {
    if (!this.editorElement.supportsAttachments) return

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
