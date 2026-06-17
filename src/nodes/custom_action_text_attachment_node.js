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

  constructor({ tagName, sgid, contentType, innerHtml, plainText }, key) {
    super(key)

    const contentTypeNamespace = Lexxy.global.get("attachmentContentTypeNamespace")

    this.tagName = tagName || CustomActionTextAttachmentNode.TAG_NAME
    this.sgid = sgid
    this.contentType = contentType || `application/vnd.${contentTypeNamespace}.unknown`
    this.innerHtml = innerHtml
    this.plainText = plainText ?? extractPlainTextFromHtml(innerHtml)
  }

  createDOM() {
    const figure = createElement(this.tagName, { "content-type": this.contentType, "data-lexxy-decorator": true, draggable: true })
    figure.dataset.lexicalNodeKey = this.__key

    figure.insertAdjacentHTML("beforeend", sanitize(this.innerHtml))
    this.#markImagesAsDecorative(figure)
    this.#tagLabelImage(figure)
    this.#tagLabelMirrors(figure)

    const deleteButton = createElement("lexxy-node-delete-button")
    figure.appendChild(deleteButton)

    return figure
  }

  get isAnnounceable() {
    return true
  }

  setupAnnouncement(figure) {
    const labelImage = figure.querySelector("[data-lexxy-label-image]")
    if (labelImage) labelImage.alt = this.label

    for (const span of figure.querySelectorAll("[data-lexxy-label-mirror]")) {
      span.setAttribute("aria-hidden", "true")
    }
  }

  teardownAnnouncement(figure) {
    const labelImage = figure.querySelector("[data-lexxy-label-image]")
    if (labelImage) labelImage.alt = ""

    for (const span of figure.querySelectorAll("[data-lexxy-label-mirror]")) {
      span.removeAttribute("aria-hidden")
    }
  }

  // Tag the figure's image (if any) so setupAnnouncement can find it later
  // without re-scanning a subtree that other modules may have added images to.
  #tagLabelImage(figure) {
    const image = figure.querySelector("img")
    if (image) image.setAttribute("data-lexxy-label-image", "")
  }

  // Tag the deepest spans whose text already matches the label so they can be
  // aria-hidden during announcement and the label isn't spoken twice. Tagged
  // at createDOM time so spans injected later (e.g. by the fake selection)
  // aren't mistakenly silenced.
  #tagLabelMirrors(figure) {
    const trimmedLabel = this.label.trim()
    const matches = [ ...figure.querySelectorAll("span") ].filter((span) => span.textContent.trim() === trimmedLabel)
    const deepest = matches.filter((span) => !matches.some((other) => other !== span && span.contains(other)))
    for (const span of deepest) span.setAttribute("data-lexxy-label-mirror", "")
  }

  #markImagesAsDecorative(figure) {
    for (const img of figure.querySelectorAll("img:not([alt])")) {
      img.alt = ""
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

  get label() {
    return this.getReadableTextContent()
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
