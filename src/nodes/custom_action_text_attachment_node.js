import Lexxy from "../config/lexxy"
import { $createTextNode, DecoratorNode, isInlineDomNode } from "lexical"

import EditorSanitizer from "../editor/sanitizer"
import { createElement, extractPlainTextFromHtml } from "../helpers/html_helper"
import { parseAttachmentContent } from "../helpers/storage_helper"

export class CustomActionTextAttachmentNode extends DecoratorNode {
  static getType() {
    return "custom_action_text_attachment"
  }

  static clone(node) {
    return new CustomActionTextAttachmentNode({ ...node }, node.__key)
  }

  static importJSON(serializedNode) {
    return new CustomActionTextAttachmentNode({ ...serializedNode })
  }

  static importDOM() {
    return {
      [this.TAG_NAME]: (element) => {
        if (!element.getAttribute("content")) {
          return null
        }

        return {
          conversion: (attachment) => {
            const nodes = []
            if (endsWithStrippedSpace(attachment)) {
              nodes.push($createTextNode(" "))
            }

            const innerHtml = parseAttachmentContent(attachment.getAttribute("content"))

            nodes.push(new CustomActionTextAttachmentNode({
              sgid: attachment.getAttribute("sgid"),
              innerHtml,
              plainText: attachment.textContent.trim() || extractPlainTextFromHtml(innerHtml),
              contentType: attachment.getAttribute("content-type")
            }))

            if (startsWithStrippedSpace(attachment)) {
              nodes.push($createTextNode(" "))
            }

            return { node: nodes }
          },
          priority: 2
        }
      }
    }
  }

  static get TAG_NAME() {
    return Lexxy.global.get("attachmentTagName")
  }

  constructor({ sgid, contentType, innerHtml, plainText } = {}, key) {
    super(key)

    const contentTypeNamespace = Lexxy.global.get("attachmentContentTypeNamespace")

    this.sgid = sgid
    this.contentType = contentType || `application/vnd.${contentTypeNamespace}.unknown`
    this.innerHtml = innerHtml
    this.plainText = plainText ?? extractPlainTextFromHtml(innerHtml)
  }

  createDOM(_config, editor) {
    const figure = createElement(CustomActionTextAttachmentNode.TAG_NAME, { "content-type": this.contentType, "data-lexxy-decorator": true, draggable: true })
    figure.dataset.lexicalNodeKey = this.__key

    // Resolved from the editor so this content is sanitized with its own
    // allowlist rather than whichever editor connected most recently.
    //
    // this.innerHtml is untrusted stored content being re-inflated into the editor,
    // so it goes through DOMPurify's mXSS-safe mode. Strictness is free here because
    // of where the `content` attribute that has to survive is sanitized, which is not
    // this hop: it is produced by exportDOM and by the server-side pass in
    // lib/lexxy/rich_text_area_tag.rb, and it is only ever sanitized on the lax hop
    // where an editor reads its own value back.
    //
    // The decoded inner markup can carry a `content` attribute of its own — nested
    // attachment markup does, and the attribute is allowlisted on the attachment tag
    // in extensions/attachments_extension.js — and mXSS-safe mode drops it. That loss
    // is cosmetic: it is a nested attachment's rendering inside this one, not the
    // attribute anything re-imports from.
    figure.insertAdjacentHTML("beforeend", EditorSanitizer.for(editor).sanitize(this.innerHtml, { safeForXml: true }))
    this.#markImagesAsDecorative(figure)
    this.#tagLabelImage(figure)
    this.#tagLabelMirrors(figure)

    return figure
  }

  exposeLabel(figure) {
    const labelImage = figure.querySelector("[data-lexxy-label-image]")
    if (labelImage) labelImage.alt = this.label

    for (const span of figure.querySelectorAll("[data-lexxy-label-mirror]")) {
      span.setAttribute("aria-hidden", "true")
    }
  }

  get label() {
    return this.getReadableTextContent()
  }

  restoreLabel(figure) {
    const labelImage = figure.querySelector("[data-lexxy-label-image]")
    if (labelImage) labelImage.alt = labelImage.dataset.lexxyOriginalAlt

    for (const span of figure.querySelectorAll("[data-lexxy-label-mirror]")) {
      span.removeAttribute("aria-hidden")
    }
  }

  updateDOM() {
    return false
  }

  getTextContent() {
    return "\ufeff"
  }

  getReadableTextContent() {
    return this.plainText || `[${this.contentType}]`
  }

  isInline() {
    return true
  }

  exportDOM() {
    const attachment = createElement(CustomActionTextAttachmentNode.TAG_NAME, {
      sgid: this.sgid,
      content: this.innerHtml,
      "content-type": this.contentType
    })

    return { element: attachment }
  }

  exportJSON() {
    return {
      type: "custom_action_text_attachment",
      version: 1,
      sgid: this.sgid,
      contentType: this.contentType,
      innerHtml: this.innerHtml,
      plainText: this.plainText
    }
  }

  decorate() {
    return null
  }

  #markImagesAsDecorative(figure) {
    for (const img of figure.querySelectorAll("img:not([alt])")) {
      img.alt = ""
    }
  }

  // Images injected later by other modules must not become the announcement image.
  #tagLabelImage(figure) {
    const image = figure.querySelector("img")
    if (image) {
      image.setAttribute("data-lexxy-label-image", "")
      image.dataset.lexxyOriginalAlt = image.alt
    }
  }

  // Duplicate labels would be spoken twice. Only authored spans should be silenced,
  // since the fake selection injects its own label later.
  #tagLabelMirrors(figure) {
    const trimmedLabel = this.label.trim()
    const matches = [ ...figure.querySelectorAll("span") ].filter((span) => span.textContent.trim() === trimmedLabel)
    const deepest = matches.filter((span) => !matches.some((other) => other !== span && span.contains(other)))
    const labelImage = figure.querySelector("[data-lexxy-label-image]")

    for (const span of deepest) {
      if (span.getAttribute("aria-hidden") !== "true") {
        if (span.contains(labelImage)) {
          this.#wrapLabelTextNodesIn(span)
        } else {
          span.setAttribute("data-lexxy-label-mirror", "")
        }
      }
    }
  }

  #wrapLabelTextNodesIn(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const textNodes = []

    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode)
    }

    for (const textNode of textNodes) {
      const mirror = createElement("span", { "data-lexxy-label-mirror": "" })
      textNode.replaceWith(mirror)
      mirror.append(textNode)
    }
  }
}

export function $isCustomActionTextAttachmentNode(node) {
  return node instanceof CustomActionTextAttachmentNode
}

// Lexical collapses whitespace on import the way browsers do, but treats an inline
// decorator as a line boundary, so the space between text and an attachment is
// dropped. These helpers mirror its rules ($convertTextDOMNode and findTextInLine)
// to restore exactly the spaces it dropped. ASCII whitespace only: Lexical keeps NBSP.
function endsWithStrippedSpace(attachment) {
  const text = textInLine(attachment, false)
  return /[ \t\r\n]$/.test(text?.data) && isTrailingSpaceStripped(text) && !isRestoredBetweenAttachments(text)
}

function startsWithStrippedSpace(attachment) {
  const text = textInLine(attachment, true)
  return /^[ \t\r\n]/.test(text?.data) && isLeadingSpaceStripped(text)
}

function isTrailingSpaceStripped(text) {
  let next = text
  while ((next = textInLine(next, true))) {
    if (/[^ \t\r\n]/.test(next.data)) return false
  }
  return true
}

function isLeadingSpaceStripped(text) {
  const previous = textInLine(text, false)
  return !previous || /[ \t\r\n]$/.test(previous.data)
}

// Whitespace alone between two attachments was already restored by the first one.
function isRestoredBetweenAttachments(text) {
  return /^[ \t\r\n]+$/.test(text.data) && isCustomAttachment(leafInLine(text, false))
}

function textInLine(node, forward) {
  let leaf = node
  while ((leaf = leafInLine(leaf, forward))?.nodeType === Node.TEXT_NODE) {
    if (leaf.data) return leaf
  }
  return null
}

// Returns the next text node in the line, or the line break, block or inline
// decorator that ends it. Comments and empty inline elements are skipped.
function leafInLine(node, forward) {
  while (true) {
    let sibling
    while ((sibling = forward ? node.nextSibling : node.previousSibling) === null) {
      node = node.parentElement
      if (node === null) return null
    }

    node = sibling
    if (node.nodeType === Node.ELEMENT_NODE && !isInlineDomNode(node)) return node

    while (forward ? node.firstChild : node.lastChild) {
      node = forward ? node.firstChild : node.lastChild
    }

    if (node.nodeType === Node.TEXT_NODE || node.nodeName === "BR") return node
  }
}

function isCustomAttachment(node) {
  return node?.localName === CustomActionTextAttachmentNode.TAG_NAME && node.hasAttribute("content")
}
