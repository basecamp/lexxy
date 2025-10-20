import { $createTextNode, DecoratorNode } from "lexical"
import { createAttachmentFigure, createElement, dispatchCustomEvent, isPreviewableImage } from "../helpers/html_helper"
import { bytesToHumanSize, mimeTypeToExtension } from "../helpers/storage_helper"

const DEFAULT_ATTACHMENT_TAG_NAME = "action-text-attachment"

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

  static importDOM(editorConfig) {

    const attachmentTagName = editorConfig?.actionText?.attachmentTagName ?? DEFAULT_ATTACHMENT_TAG_NAME

    return {
      [attachmentTagName]: (attachment) => {
        const content = attachment.getAttribute("content")
        if (!attachment.getAttribute("content")) {
          return null
        }

        return {
          conversion: () => {
            // Preserve initial space if present since Lexical removes it
            const nodes = []
            const previousSibling = attachment.previousSibling
            if (previousSibling && previousSibling.nodeType === Node.TEXT_NODE && /\s$/.test(previousSibling.textContent)) {
              nodes.push($createTextNode(" "))
            }

            nodes.push(new CustomActionTextAttachmentNode({
              tagName: attachmentTagName,
              sgid: attachment.getAttribute("sgid"),
              innerHtml: JSON.parse(content),
              contentType: attachment.getAttribute("content-type")
            }))

            nodes.push($createTextNode(" "))

            return { node: nodes }
          },
          priority: 2
        }
      }
    }
  }

  constructor({ tagName, sgid, contentType, innerHtml }, key) {
    super(key)

    this.tagName = tagName || DEFAULT_ATTACHMENT_TAG_NAME
    this.sgid = sgid
    this.contentType = contentType || "application/vnd.actiontext.unknown"
    this.innerHtml = innerHtml
  }

  createDOM() {
    const figure = createElement(this.tagName, { "content-type": this.contentType, "data-lexxy-decorator": true })

    figure.addEventListener("click", (event) => {
      dispatchCustomEvent(figure, "lexxy:internal:select-node", { key: this.getKey() })
    })

    figure.insertAdjacentHTML("beforeend", this.innerHtml)

    return figure
  }

  updateDOM() {
    return true
  }

  isInline() {
    return true
  }

  exportDOM() {
    const attachment = createElement(this.tagName, {
      sgid: this.sgid,
      content: JSON.stringify(this.innerHtml),
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
      innerHtml: this.innerHtml
    }
  }

  decorate() {
    return null
  }
}
