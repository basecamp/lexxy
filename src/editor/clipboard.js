import { marked } from "marked"
import { isUrl } from "../helpers/string_helper"
import { nextFrame } from "../helpers/timing_helpers"
import { dispatch } from "../helpers/html_helper"
import { $getSelection, PASTE_TAG } from "lexical"
import { $insertDataTransferForRichText } from "@lexical/clipboard"

export default class Clipboard {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.selection = editorElement.selection
  }

  paste(event) {
    const clipboardData = event.clipboardData

    // Allow default Lexical paste behavior in code blocks
    if (!clipboardData || this.#isPastingIntoCodeBlock) return false

    const paster = Paster.for(clipboardData, this.editorElement)
    if (paster?.paste()) {
      event.preventDefault()
      return true
    } else {
      return false
    }
  }

  get #isPastingIntoCodeBlock() {
    return this.selection.isInsideCodeBlock
  }
}

class Paster {
  static for(clipboardData, editorElement) {
    const pasterKlass = this.#pasters.find(paster => paster.handles(clipboardData, editorElement))
    return new pasterKlass(clipboardData, editorElement)
  }

  static handles(clipboardData) {
    return Boolean(clipboardData)
  }

  static get #pasters() {
    return [
      UrlPaster,
      MarkdownPaster,
      PlainTextPaster,
      HtmlPaster,
      Paster
    ]
  }

  constructor(clipboardData, editorElement) {
    this.clipboardData = clipboardData

    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.contents = editorElement.contents
  }

  paste() {
    if (!this.editorElement.supportsAttachments) return

    return this.#handlePastedFiles()
  }

  #handlePastedFiles() {
    this.#preservingScrollPosition(() => {
      const files = this.clipboardData.files
      if (files.length) {
        this.contents.uploadFiles(files, { selectLast: true })
      }
    })

    return true
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

class UrlPaster extends Paster {
  static handles(clipboardData) {
    return this.#isOnlyURLPasted(clipboardData)
  }

  static #isOnlyURLPasted(clipboardData) {
    // Safari URLs are copied as a text/plain + text/uri-list object
    const types = Array.from(clipboardData.types)
    return types.length === 2 && types.includes("text/uri-list") && types.includes("text/plain")
  }

  paste() {
    const item = this.clipboardData.items[0]
    item.getAsString(linkText => this.pasteLink(linkText))

    return true
  }

  pasteLink(linkText) {
    if (this.contents.hasSelectedText()) {
      this.contents.createLinkWithSelectedText(linkText)
    } else {
      const nodeKey = this.contents.createLink(linkText)
      this.#dispatchLinkInsertEvent(nodeKey, { url: linkText })
    }
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
}

class PlainTextPaster extends Paster {
  static handles(clipboardData) {
    return this.isOnlyPlainTextPasted(clipboardData)
  }

  static isOnlyPlainTextPasted(clipboardData) {
    const types = Array.from(clipboardData.types)
    return types.length === 1 && types[0] === "text/plain"
  }

  paste() {
    this.withItemText(() => this.#pasteRichText())

    return true
  }

  withItemText(callback) {
    const item = this.clipboardData.items[0]

    item.getAsString(text => {
      if (this.#pasteAsUrl(text)) return

      callback(text)
    })
  }

  #pasteAsUrl(text) {
    if (!isUrl(text)) return false

    const urlPaster = new UrlPaster(null, this.editorElement)
    urlPaster.pasteLink(text)

    return true
  }

  #pasteRichText() {
    this.editor.update(() => {
      const selection = $getSelection()
      $insertDataTransferForRichText(this.clipboardData, selection, this.editor)
    }, { tag: PASTE_TAG })
  }
}

class MarkdownPaster extends PlainTextPaster {
  static handles(clipboardData, editorElement) {
    return editorElement.supportsMarkdown && super.handles(clipboardData)
  }

  paste() {
    this.withItemText(text => {
      const html = marked(text)
      this.contents.insertHtml(html, { tag: PASTE_TAG })
    })

    return true
  }
}

class HtmlPaster extends Paster {
  static handles(clipboardData, editorElement) {
    return editorElement.supportsAttachments && this.#hasHtmlDataType(clipboardData)
  }

  static #hasHtmlDataType(clipboardData) {
    return clipboardData.types.includes("text/html")
  }

  paste() {
    const html = this.clipboardData.getData("text/html")
    this.contents.insertHtml(html, { tag: PASTE_TAG })
    return true
  }
}
