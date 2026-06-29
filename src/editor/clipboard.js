import { marked } from "marked"
import { isAutolinkableURL } from "../helpers/string_helper"
import { nextFrame } from "../helpers/timing_helper"
import { addBlockSpacing, dispatch, parseHtml } from "../helpers/html_helper"
import { $isCodeNode } from "@lexical/code"
import { $createTextNode, $getSelection, $isParagraphNode, $isRangeSelection, $onUpdate, COMMAND_PRIORITY_NORMAL, PASTE_COMMAND, PASTE_TAG, SELECTION_INSERT_CLIPBOARD_NODES_COMMAND } from "lexical"
import { $insertDataTransferForRichText } from "@lexical/clipboard"
import { $createLinkNode, $isLinkNode, $toggleLink } from "@lexical/link"
import { ListenerBin } from "../helpers/listener_helper"
import NodeInserter from "./contents/node_inserter"

export default class Clipboard {
  #listeners = new ListenerBin()

  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.contents = editorElement.contents

    this.#registerPasteCommands()
  }

  dispose() {
    this.editorElement = null
    this.editor = null
    this.contents = null

    this.#listeners.dispose()
  }

  paste(event) {
    const clipboardData = event.clipboardData

    if (!clipboardData) return false

    if (this.#isPastingIntoCodeBlock()) {
      this.#pastePlainTextIntoCodeBlock(clipboardData)
      event.preventDefault()
      return true
    }

    if (this.#isPlainTextOrURLPasted(clipboardData)) {
      this.#pastePlainTextOrURL(clipboardData)
      event.preventDefault()
      return true
    }

    const handled = this.#handlePastedFiles(clipboardData)
    if (handled) event.preventDefault()
    return handled
  }

  #registerPasteCommands() {
    this.#listeners.track(
      this.editor.registerCommand(PASTE_COMMAND, this.paste.bind(this), COMMAND_PRIORITY_NORMAL),
      this.editor.registerCommand(
        SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
        (payload) => this.#handleParsedClipboardNodes(payload),
        COMMAND_PRIORITY_NORMAL
      )
    )
  }

  #handleParsedClipboardNodes({ nodes, selection }) {
    const url = $bareUrlFromSingleLink(nodes)
    if (url && $isRangeSelection(selection)) {
      this.#insertSingleLinkAt(selection, url)
      return true
    }
  }

  #isPlainTextOrURLPasted(clipboardData) {
    return this.#isOnlyPlainTextPasted(clipboardData) || this.#isOnlyURLPasted(clipboardData)
  }

  #isOnlyPlainTextPasted(clipboardData) {
    const types = Array.from(clipboardData.types)
    return types.length === 1 && types[0] === "text/plain"
  }

  // Browsers expose a copied URL in several shapes:
  //   Safari          [ text/plain, text/uri-list ]
  //   App ShareSheet  [ text/uri-list ]
  //   Chromium macOS  [ text/plain, text/html, (?:text/link-preview) ]
  #isOnlyURLPasted(clipboardData) {
    if (this.#isLexicalClipboardData(clipboardData)) return false

    const types = Array.from(clipboardData.types)
    if (types.includes("text/uri-list")) {
      return types.every(type => type === "text/plain" || type === "text/uri-list")
    }

    if (clipboardData.files.length) return false

    const text = clipboardData.getData("text/plain").trim()
    if (!isAutolinkableURL(text)) return false

    const html = clipboardData.getData("text/html")
    return !html || this.#htmlIsBareLinkToURL(html, text)
  }

  #htmlIsBareLinkToURL(html, url) {
    const doc = parseHtml(html)
    if (doc.body.textContent.trim() !== url) return false

    const links = doc.body.querySelectorAll("a")
    if (links.length === 0) return true
    return links.length === 1 && links[0].getAttribute("href") === url
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

  #pastePlainTextIntoCodeBlock(clipboardData) {
    const text = clipboardData.getData("text/plain")
    if (!text) return

    this.editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) selection.insertRawText(text)
    }, { tag: PASTE_TAG })
  }

  #pastePlainTextOrURL(clipboardData) {
    const item = this.#plainTextOrURLItem(clipboardData)
    item.getAsString((text) => {
      const url = text.trim()
      if (isAutolinkableURL(url)) {
        this.#pasteURL(url)
      } else if (this.editorElement.supportsMarkdown) {
        this.#pasteMarkdown(text)
      } else {
        this.#pasteRichText(clipboardData)
      }
    })
  }

  #plainTextOrURLItem(clipboardData) {
    const items = Array.from(clipboardData.items)
    return items.find((item) => item.type === "text/plain") || items.find((item) => item.type === "text/uri-list")
  }

  #pasteURL(url) {
    if (this.contents.hasSelectedText()) {
      this.contents.createLinkWithSelectedText(url)
    } else {
      const nodeKey = this.contents.createLink(url)
      this.#dispatchLinkInsertEvent(nodeKey, { url })
    }
  }

  #insertSingleLinkAt(selection, url) {
    if (!$isRangeSelection(selection)) return

    if (!selection.isCollapsed()) {
      $toggleLink(null)
      $toggleLink(url)
      return
    }

    const linkNode = $createLinkNode(url).append($createTextNode(url))
    NodeInserter.for(selection).insertNodes([ linkNode ])

    $onUpdate(() => this.#dispatchLinkInsertEvent(linkNode.getKey(), { url }))
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
    const html = marked(text, { breaks: true })
    const doc = parseHtml(html)

    if (this.#isPlainTextWithoutMarkdown(doc)) {
      this.contents.insertText(text, { tag: PASTE_TAG })
    } else {
      const detail = Object.freeze({
        markdown: text,
        document: doc,
        addBlockSpacing: () => addBlockSpacing(doc)
      })

      dispatch(this.editorElement, "lexxy:insert-markdown", detail)
      this.contents.insertDOM(doc, { tag: PASTE_TAG })
    }
  }

  // Markdown conversion collapses runs of whitespace and unescapes backslashes,
  // silently corrupting plain text such as Windows/UNC file paths. When the text
  // carries no Markdown structure, paste it verbatim instead. A path that wrapped
  // across lines renders as a single paragraph with <br> line breaks (marked runs
  // with breaks: true), which is still plain text we should preserve untouched.
  #isPlainTextWithoutMarkdown(doc) {
    const elements = Array.from(doc.body.children)
    if (elements.length !== 1) return false

    const paragraph = elements[0]
    return paragraph.nodeName === "P"
      && Array.from(paragraph.childNodes).every((node) => node.nodeType === Node.TEXT_NODE || node.nodeName === "BR")
  }

  #pasteRichText(clipboardData) {
    this.editor.update(() => {
      const selection = $getSelection()
      $insertDataTransferForRichText(clipboardData, selection, this.editor)
    }, { tag: PASTE_TAG })
  }

  #handlePastedFiles(clipboardData) {
    if (!this.editorElement.supportsAttachments) return false

    const html = clipboardData.getData("text/html")
    const files = clipboardData.files

    if (files.length && this.#isCopiedImageHTML(html)) {
      this.#uploadFilesPreservingScroll(files)
      return true
    }

    if (html && !this.#isLexicalClipboardData(clipboardData)) {
      this.contents.insertHtml(html, { tag: PASTE_TAG })
      return true
    }

    if (files.length) {
      this.#uploadFilesPreservingScroll(files)
      return true
    }

    return false
  }

  #isLexicalClipboardData(clipboardData) {
    return Array.from(clipboardData.types).includes("application/x-lexical-editor")
  }

  #isCopiedImageHTML(html) {
    if (!html) return false

    const doc = parseHtml(html)
    const elementChildren = Array.from(doc.body.children)

    return elementChildren.length === 1 && elementChildren[0].tagName === "IMG"
  }

  #uploadFilesPreservingScroll(files) {
    this.#preservingScrollPosition(() => {
      if (files.length) {
        this.contents.uploadFiles(files, { selectLast: true })
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

function $bareUrlFromSingleLink(nodes) {
  if (nodes.length !== 1) return null

  const node = nodes[0]
  if ($isLinkNode(node)) return $bareUrlFromLink(node)

  if ($isParagraphNode(node)) {
    const children = node.getChildren()
    if (children.length === 1 && $isLinkNode(children[0])) {
      return $bareUrlFromLink(children[0])
    }
  }

  return null
}

function $bareUrlFromLink(linkNode) {
  const url = linkNode.getURL()
  if (!url) return null
  return linkNode.getTextContent() === url ? url : null
}
