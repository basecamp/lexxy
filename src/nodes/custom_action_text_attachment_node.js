import { $createTextNode, DecoratorNode } from "lexical"

import { createElement, dispatchCustomEvent } from "../helpers/html_helper"
import { ATTACHMENT_TAG_NAME } from "../config/attachment_tag_name"

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
      [ATTACHMENT_TAG_NAME]: (element) => {
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

            nodes.push(new CustomActionTextAttachmentNode({
              tagName: ATTACHMENT_TAG_NAME,
              sgid: attachment.getAttribute("sgid"),
              innerHtml: JSON.parse(attachment.getAttribute("content")),
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

    this.tagName = tagName || ATTACHMENT_TAG_NAME
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
