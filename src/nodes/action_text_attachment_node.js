import Lexxy from "../config/lexxy"
import { $getEditor, DecoratorNode, HISTORY_MERGE_TAG } from "lexical"
import { createAttachmentFigure, createElement, isPreviewableImage } from "../helpers/html_helper"
import { bytesToHumanSize } from "../helpers/storage_helper"


export class ActionTextAttachmentNode extends DecoratorNode {
  static getType() {
    return "action_text_attachment"
  }

  static clone(node) {
    return new ActionTextAttachmentNode({ ...node }, node.__key)
  }

  static importJSON(serializedNode) {
    return new ActionTextAttachmentNode({ ...serializedNode })
  }

  static importDOM() {
    return {
      [this.TAG_NAME]: () => {
        return {
          conversion: (attachment) => ({
            node: new ActionTextAttachmentNode({
              sgid: attachment.getAttribute("sgid"),
              src: attachment.getAttribute("url"),
              previewable: attachment.getAttribute("previewable"),
              altText: attachment.getAttribute("alt"),
              caption: attachment.getAttribute("caption"),
              contentType: attachment.getAttribute("content-type"),
              fileName: attachment.getAttribute("filename"),
              fileSize: attachment.getAttribute("filesize"),
              width: attachment.getAttribute("width"),
              height: attachment.getAttribute("height")
            })
          }), priority: 1
        }
      },
      "img": () => {
        return {
          conversion: (img) => ({
            node: new ActionTextAttachmentNode({
              src: img.getAttribute("src"),
              caption: img.getAttribute("alt") || "",
              contentType: "image/*",
              width: img.getAttribute("width"),
              height: img.getAttribute("height")
            })
          }), priority: 1
        }
      },
      "video": () => {
        return {
          conversion: (video) => {
            const videoSource = video.getAttribute("src") || video.querySelector("source")?.src
            const fileName = videoSource?.split("/")?.pop()
            const contentType = video.querySelector("source")?.getAttribute("content-type") || "video/*"

            return {
              node: new ActionTextAttachmentNode({
                src: videoSource,
                fileName: fileName,
                contentType: contentType
              })
            }
          }, priority: 1
        }
      }
    }
  }

  static get TAG_NAME() {
    return Lexxy.global.get("attachmentTagName")
  }

  constructor({ tagName, sgid, src, previewable, altText, caption, contentType, fileName, fileSize, width, height }, key) {
    super(key)

    this.tagName = tagName || ActionTextAttachmentNode.TAG_NAME
    this.sgid = sgid
    this.src = src
    this.previewable = previewable
    this.altText = altText || ""
    this.caption = caption || ""
    this.contentType = contentType || ""
    this.fileName = fileName || ""
    this.fileSize = fileSize
    this.width = width
    this.height = height

    this.editor = $getEditor()
  }

  createDOM() {
    const figure = this.createAttachmentFigure()

    if (this.isPreviewableAttachment) {
      figure.appendChild(this.#createDOMForImage())
      figure.appendChild(this.#createEditableCaption())
    } else {
      figure.appendChild(this.#createDOMForFile())
      figure.appendChild(this.#createDOMForNotImage())
    }

    return figure
  }

  updateDOM(_prevNode, dom) {
    const caption = dom.querySelector("figcaption textarea")
    if (caption && this.caption) {
      caption.value = this.caption
    }

    return false
  }

  getTextContent() {
    return `[${this.caption || this.fileName}]\n\n`
  }

  isInline() {
    return false
  }

  exportDOM() {
    const attachment = createElement(this.tagName, {
      sgid: this.sgid,
      previewable: this.previewable || null,
      url: this.src,
      alt: this.altText,
      caption: this.caption,
      "content-type": this.contentType,
      filename: this.fileName,
      filesize: this.fileSize,
      width: this.width,
      height: this.height,
      presentation: "gallery"
    })

    return { element: attachment }
  }

  exportJSON() {
    return {
      type: "action_text_attachment",
      version: 1,
      tagName: this.tagName,
      sgid: this.sgid,
      src: this.src,
      previewable: this.previewable,
      altText: this.altText,
      caption: this.caption,
      contentType: this.contentType,
      fileName: this.fileName,
      fileSize: this.fileSize,
      width: this.width,
      height: this.height
    }
  }

  decorate() {
    return null
  }

  createAttachmentFigure() {
    return createAttachmentFigure(this.contentType, this.isPreviewableAttachment, this.fileName)
  }

  get #isPreviewableImage() {
    return isPreviewableImage(this.contentType)
  }

  get isPreviewableAttachment() {
    return this.#isPreviewableImage || this.previewable
  }

  #createDOMForImage() {
    return createElement("img", { src: this.src, alt: this.altText, ...this.#imageDimensions })
  }

  get #imageDimensions() {
    if (this.width && this.height) {
      return { width: this.width, height: this.height }
    } else {
      return {}
    }
  }

  #createDOMForFile() {
    const extension = this.fileName ? this.fileName.split(".").pop().toLowerCase() : "unknown"
    return createElement("span", { className: "attachment__icon", textContent: `${extension}` })
  }

  #createDOMForNotImage() {
    const figcaption = createElement("figcaption", { className: "attachment__caption" })

    const nameTag = createElement("strong", { className: "attachment__name", textContent: this.caption || this.fileName })

    figcaption.appendChild(nameTag)

    if (this.fileSize) {
      const sizeSpan = createElement("span", { className: "attachment__size", textContent: bytesToHumanSize(this.fileSize) })
      figcaption.appendChild(sizeSpan)
    }

    return figcaption
  }

  #createEditableCaption() {
    const caption = createElement("figcaption", { className: "attachment__caption" })
    const input = createElement("textarea", {
      value: this.caption,
      placeholder: this.fileName,
      rows: "1"
    })

    input.addEventListener("focusin", () => input.placeholder = "Add caption...")
    input.addEventListener("blur", (event) => this.#handleCaptionInputBlurred(event))
    input.addEventListener("keydown", (event) => this.#handleCaptionInputKeydown(event))

    caption.appendChild(input)

    return caption
  }

  #handleCaptionInputBlurred(event) {
    this.#updateCaptionValueFromInput(event.target)
  }

  #updateCaptionValueFromInput(input) {
    input.placeholder = this.fileName
    this.editor.update(() => {
      this.getWritable().caption = input.value
    })
  }

  #handleCaptionInputKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      event.target.blur()

      this.editor.update(() => {
        // Place the cursor after the current image
        this.selectNext(0, 0)
      }, {
        tag: HISTORY_MERGE_TAG
      })
    }

  }
}
