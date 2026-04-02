import Lexxy from "../config/lexxy"
import { $getEditor, $getNearestRootOrShadowRoot, DecoratorNode, HISTORY_MERGE_TAG } from "lexical"
import { createAttachmentFigure, createElement, isPreviewableImage } from "../helpers/html_helper"
import { bytesToHumanSize, extractFileName } from "../helpers/storage_helper"
import { parseBoolean } from "../helpers/string_helper"


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
          conversion: (img) => {
            const fileName = extractFileName(img.getAttribute("src") ?? "")
            return {
              node: new ActionTextAttachmentNode({
                src: img.getAttribute("src"),
                fileName: fileName,
                caption: img.getAttribute("alt") || "",
                contentType: "image/*",
                width: img.getAttribute("width"),
                height: img.getAttribute("height")
              })
            }
          }, priority: 1
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

  constructor({ tagName, sgid, src, previewSrc, previewable, altText, caption, contentType, fileName, fileSize, width, height, uploadError }, key) {
    super(key)

    this.tagName = tagName || ActionTextAttachmentNode.TAG_NAME
    this.sgid = sgid
    this.src = src
    this.previewSrc = previewSrc
    this.previewable = parseBoolean(previewable)
    this.altText = altText || ""
    this.caption = caption || ""
    this.contentType = contentType || ""
    this.fileName = fileName || ""
    this.fileSize = fileSize
    this.width = width
    this.height = height
    this.uploadError = uploadError

    this.editor = $getEditor()
  }

  createDOM() {
    if (this.uploadError) return this.createDOMForError()

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

  updateDOM(prevNode, dom) {
    if (this.uploadError !== prevNode.uploadError) return true

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
    return this.isAttached() && !this.getParent().is($getNearestRootOrShadowRoot(this))
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

  createDOMForError() {
    const figure = this.createAttachmentFigure()
    figure.classList.add("attachment--error")
    figure.appendChild(createElement("div", { innerText: `Error uploading ${this.fileName || "file"}` }))
    return figure
  }

  createAttachmentFigure(previewable = this.isPreviewableAttachment) {
    const figure = createAttachmentFigure(this.contentType, previewable, this.fileName)
    figure.draggable = true
    figure.dataset.lexicalNodeKey = this.__key

    const deleteButton = createElement("lexxy-node-delete-button")
    figure.appendChild(deleteButton)

    return figure
  }

  get isPreviewableAttachment() {
    return this.isPreviewableImage || this.previewable
  }

  get isPreviewableImage() {
    return isPreviewableImage(this.contentType)
  }

  #createDOMForImage(options = {}) {
    const initialSrc = this.previewSrc || this.src
    const img = createElement("img", { src: initialSrc, draggable: false, alt: this.altText, ...this.#imageDimensions, ...options })

    if (this.previewable && !this.isPreviewableImage) {
      img.onerror = () => this.#swapPreviewToFileDOM(img)
    }

    if (this.previewSrc) {
      this.#preloadAndSwapSrc(img)
    }

    const container = createElement("div", { className: "attachment__container" })
    container.appendChild(img)
    return container
  }

  #preloadAndSwapSrc(img) {
    const previewSrc = this.previewSrc
    const serverImage = new Image()

    serverImage.onload = () => {
      img.src = this.src
      this.editor.update(() => {
        this.getWritable().previewSrc = null
      })
      this.#revokePreviewSrc(previewSrc)
    }

    serverImage.onerror = () => {
      this.#revokePreviewSrc(previewSrc)
      this.editor.update(() => {
        this.getWritable().previewSrc = null
        this.getWritable().uploadError = true
      })
    }

    serverImage.src = this.src
  }

  #revokePreviewSrc(previewSrc) {
    if (previewSrc?.startsWith("blob:")) URL.revokeObjectURL(previewSrc)
  }

  #swapPreviewToFileDOM(img) {
    const figure = img.closest("figure.attachment")
    if (!figure) return

    figure.className = figure.className.replace("attachment--preview", "attachment--file")

    const container = figure.querySelector(".attachment__container")
    if (container) container.remove()

    const caption = figure.querySelector("figcaption")
    if (caption) caption.remove()

    figure.appendChild(this.#createDOMForFile())
    figure.appendChild(this.#createDOMForNotImage())
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
    input.addEventListener("copy", (event) => event.stopPropagation())
    input.addEventListener("cut", (event) => event.stopPropagation())
    input.addEventListener("paste", (event) => event.stopPropagation())

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
      event.target.blur()

      this.editor.update(() => {
        // Place the cursor after the current image
        this.selectNext(0, 0)
      }, {
        tag: HISTORY_MERGE_TAG
      })
    }

    // Stop all keydown events from bubbling to the Lexical root element.
    // The caption textarea is outside Lexical's content model and should
    // handle its own keyboard events natively (Ctrl+A, Ctrl+C, Ctrl+X, etc.).
    event.stopPropagation()
  }
}

export function $createActionTextAttachmentNode(...args) {
  return new ActionTextAttachmentNode(...args)
}

export function $isActionTextAttachmentNode(node) {
  return node instanceof ActionTextAttachmentNode
}
