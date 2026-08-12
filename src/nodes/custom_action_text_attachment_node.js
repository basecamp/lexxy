import Lexxy from "../config/lexxy"
import { $createTextNode, DecoratorNode } from "lexical"

import { createElement, extractPlainTextFromHtml } from "../helpers/html_helper"
import { sanitize } from "../helpers/sanitization_helper"
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
            // Preserve initial space if present since Lexical removes it
            const nodes = []
            const previousSibling = attachment.previousSibling
            if (previousSibling && previousSibling.nodeType === Node.TEXT_NODE && /\s$/.test(previousSibling.textContent)) {
              nodes.push($createTextNode(" "))
            }

            const innerHtml = parseAttachmentContent(attachment.getAttribute("content"))

            nodes.push(new CustomActionTextAttachmentNode({
              sgid: attachment.getAttribute("sgid"),
              innerHtml,
              plainText: attachment.textContent.trim() || extractPlainTextFromHtml(innerHtml),
              contentType: attachment.getAttribute("content-type")
            }))

            const nextSibling = attachment.nextSibling
            if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE && /^\s/.test(nextSibling.textContent)) {
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

  constructor({ tagName, sgid, contentType, innerHtml, plainText } = {}, key) {
    super(key)

    const contentTypeNamespace = Lexxy.global.get("attachmentContentTypeNamespace")

    this.tagName = tagName || CustomActionTextAttachmentNode.TAG_NAME
    this.sgid = sgid
    this.contentType = contentType || `application/vnd.${contentTypeNamespace}.unknown`
    this.innerHtml = innerHtml
    this.plainText = plainText ?? extractPlainTextFromHtml(innerHtml)
  }

  createDOM(_config, editor) {
    const figure = createElement(this.tagName, { "content-type": this.contentType, "data-lexxy-decorator": true, draggable: true })
    figure.dataset.lexicalNodeKey = this.__key

    // The editor is passed through so this content is sanitized with its own
    // allowlist rather than whichever editor connected most recently.
    //
    // this.innerHtml is untrusted stored content being re-inflated into the editor,
    // so it goes through DOMPurify's mXSS-safe mode. What is sanitized here is the
    // decoded inner markup, which carries no serialized `content` attribute of its
    // own — that attribute is only ever produced by exportDOM, where SAFE_FOR_XML
    // is off — so mXSS-safe mode is free to be strict on this hop.
    figure.insertAdjacentHTML("beforeend", sanitize(this.innerHtml, editor, { safeForXml: true }))

    const deleteButton = createElement("lexxy-node-delete-button")
    figure.appendChild(deleteButton)

    return figure
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
    const attachment = createElement(this.tagName, {
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
      tagName: this.tagName,
      sgid: this.sgid,
      contentType: this.contentType,
      innerHtml: this.innerHtml,
      plainText: this.plainText
    }
  }

  decorate() {
    return null
  }
}

export function $isCustomActionTextAttachmentNode(node) {
  return node instanceof CustomActionTextAttachmentNode
}
