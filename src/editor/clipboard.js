import { Marked, marked } from "marked"
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
    const html = pasteMarked.parse(text)
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

// A marked instance scoped to the paste flow (never mutate marked's global
// defaults). Its options mirror the render pass #pasteMarkdown used before —
// marked's defaults plus breaks: true — so gfm stays on and tables still parse.
//
// The only customization is the `html` renderer. Following CommonMark, marked
// tokenizes a bare "<tag>" in prose as raw inline (or block) HTML. That is
// intentional for recognized tags — pasted plain text carrying <span style>,
// <mark>, <b>… is styled on import — but for an *unrecognized* element the
// Lexical importer has no converter and silently unwraps it, dropping the tag.
// WEBVTT speaker cues such as "<v Nabila Abdel Nabi>", where the name lives in
// what the HTML parser reads as attributes, thus vanish entirely.
//
// Classifying at marked's html renderer rides its public token grammar instead
// of shadowing it: marked routes code (`code`/`codespan`), autolinks and
// [text](<dest>) links to *other* token types that never reach this renderer,
// so their literal "<...>" content is preserved for free — no pre-escaping,
// code-region collection, or lexer-option syncing required. This renderer fires
// only for genuine raw-HTML tokens, and marked inserts its return value verbatim
// (it does not re-encode), so we escape unsupported tags to literal text here.
const pasteMarked = new Marked({
  ...marked.defaults,
  breaks: true,
  renderer: { html: renderPastedHtmlToken }
})

// Matches a single HTML tag lexeme: an optional "/", a tag name, then attribute
// characters up to the closing ">". Quoted attribute values may contain ">" —
// the HTML tokenizer consumes them as part of the value, and marked's tag
// grammar matches them into the same raw token — so the attribute run matches
// quoted strings whole. Otherwise a lexeme like <v title="a > b"> would end at
// the inner ">", escaping only the prefix and leaving the tail for DOMParser
// to decode.
const HTML_TAG_LEXEME = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g

// Escape unknown tags *within* the raw-HTML token, keeping known tags intact.
// Lexeme-level (not whole-token) escaping matters because marked can emit a
// single coarse block-HTML token whose first tag is known but which nests an
// unknown one — e.g. "<div><v Name> Hello</div>" arrives as one token. We keep
// the <div> so it still renders, and escape the nested <v Name> so it survives
// as literal text rather than being unwrapped and dropped by the importer.
function renderPastedHtmlToken(token) {
  return token.text.replace(HTML_TAG_LEXEME, (lexeme, _slash, name) => {
    return isSupportedHtmlElement(name) ? lexeme : escapeHtml(lexeme)
  })
}

// The renderer's output is final, so escape the full lexeme — "&", "<" and ">" —
// for an exact round-trip (e.g. "<v A&nbsp;B>" → "&lt;v A&amp;nbsp;B&gt;").
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// "Supported" — safe to pass through for the importer to handle — is decided from
// the element taxonomy, not the importer's converter registry. The importer both
// converts tags it has a converter for (span→mark, b→bold, tr/td→table cells) and
// transparently traverses standard structural wrappers it has *no* converter for
// (thead, tbody, tfoot, colgroup, caption), keeping their children. A converter
// registry (editor._htmlConversions) lists only the former, so classifying by it
// escaped those wrappers to literal text and corrupted pasted tables — foster
// parenting hoisted "&lt;thead&gt;…" out as a stray paragraph. The taxonomy covers
// both: a standard HTML element is either converted or losslessly unwrapped.
//
// Two exclusions escape the tag to literal text instead:
//   - Invented tags (WEBVTT's "<v Nabila Abdel Nabi>", "<foo>"): document
//     .createElement returns HTMLUnknownElement. The importer would unwrap them,
//     dropping the tag — and for <v Name> the name lives in what parses as
//     attributes, so it vanishes entirely.
//   - Custom elements (turbo-frame, bc-attachment, action-text-attachment): a
//     hyphenated name is a custom element (HTML spec; no standard element has a
//     hyphen). They're excluded even when the importer registers a converter, so
//     a plain-text paste can never materialize an attachment/widget. Legitimate
//     attachments arrive through the rich-HTML paste path, not here.
function isSupportedHtmlElement(name) {
  const tag = name.toLowerCase()
  return !(document.createElement(tag) instanceof HTMLUnknownElement) && !tag.includes("-")
}
