import { $getNodeByKey } from "lexical"
import { DirectUpload } from "@rails/activestorage"
import { ActionTextAttachmentNode } from "./action_text_attachment_node"
import { createElement, dispatchCustomEvent } from "../helpers/html_helper"
import { loadFileIntoImage } from "../helpers/upload_helper"
import { HISTORY_MERGE_TAG } from "lexical"
import { bytesToHumanSize } from "../helpers/storage_helper"

export class ActionTextAttachmentUploadNode extends ActionTextAttachmentNode {
  static getType() {
    return "action_text_attachment_upload"
  }

  static clone(node) {
    return new ActionTextAttachmentUploadNode({ ...node }, node.__key)
  }

  static importJSON(serializedNode) {
    return new ActionTextAttachmentUploadNode({ ...serializedNode })
  }

  constructor(node, key) {
    const { file, uploadUrl, blobUrlTemplate, editor, progress } = node
    super({ ...node, contentType: file.type }, key)
    this.file = file
    this.uploadUrl = uploadUrl
    this.blobUrlTemplate = blobUrlTemplate
    this.src = null
    this.editor = editor
    this.progress = progress || 0
  }

  createDOM() {
    const figure = this.createAttachmentFigure()

    if (this.isPreviewableAttachment) {
      figure.appendChild(this.#createDOMForImage())
    } else {
      figure.appendChild(this.#createDOMForFile())
    }

    figure.appendChild(this.#createCaption())

    const progressBar = createElement("progress", { value: this.progress, max: 100 })
    figure.appendChild(progressBar)

    // We wait for images to download so that we can pass the dimensions down to the attachment. We do this
    // so that we can render images in edit mode with the dimensions set, which prevent vertical layout shifts.
    this.#loadFigure(figure).then(() => this.#startUpload(progressBar, figure))

    return figure
  }

  exportDOM() {
    const img = document.createElement("img")
    if (this.src) {
      img.src = this.src
    }
    return { element: img }
  }

  exportJSON() {
    return {
      type: "action_text_attachment_upload",
      version: 1,
      progress: this.progress,
      uploadUrl: this.uploadUrl,
      blobUrlTemplate: this.blobUrlTemplate,
      ...super.exportJSON()
    }
  }

  #createDOMForImage() {
    return createElement("img")
  }

  #createDOMForFile() {
    const extension = this.#getFileExtension()
    const span = createElement("span", { className: "attachment__icon", textContent: extension })
    return span
  }

  #getFileExtension() {
    return this.file.name.split(".").pop().toLowerCase()
  }

  #createCaption() {
    const figcaption = createElement("figcaption", { className: "attachment__caption" })

    const nameSpan = createElement("span", { className: "attachment__name", textContent: this.file.name || "" })
    const sizeSpan = createElement("span", { className: "attachment__size", textContent: bytesToHumanSize(this.file.size) })
    figcaption.appendChild(nameSpan)
    figcaption.appendChild(sizeSpan)

    return figcaption
  }

  #loadFigure(figure) {
    const image = figure.querySelector("img")
    if (!image) {
      return Promise.resolve()
    } else {
      return loadFileIntoImage(this.file, image)
    }
  }

  #startUpload(progressBar, figure) {
    const upload = new DirectUpload(this.file, this.uploadUrl, this)

    upload.delegate = {
      directUploadWillCreateBlobWithXHR: (request) => {
        dispatchCustomEvent(figure, "lexxy:before-blob-request", { request })
      },
      directUploadWillStoreFileWithXHR: (request) => {
        dispatchCustomEvent(figure, "lexxy:before-storage-request", { request })

        request.upload.addEventListener("progress", (event) => {
          this.editor.update(() => {
            progressBar.value = Math.round(event.loaded / event.total * 100)
          })
        })
      }
    }

    upload.create((error, blob) => {
      if (error) {
        this.#handleUploadError(figure)
      } else {
        this.#loadFigurePreviewFromBlob(blob, figure).then(() => {
          this.#showUploadedAttachment(figure, blob)
        })
      }
    })
  }

  #handleUploadError(figure) {
    figure.innerHTML = ""
    figure.classList.add("attachment--error")
    figure.appendChild(createElement("div", { innerText: `Error uploading ${this.file?.name ?? "image"}` }))
  }

  async #showUploadedAttachment(figure, blob) {
    this.editor.update(() => {
      const image = figure.querySelector("img")

      const src = this.blobUrlTemplate
        .replace(":signed_id", blob.signed_id)
        .replace(":filename", encodeURIComponent(blob.filename))
      const latest = $getNodeByKey(this.getKey())
      if (latest) {
        latest.replace(new ActionTextAttachmentNode({
          tagName: this.tagName,
          sgid: blob.attachable_sgid,
          src: blob.previewable ? blob.url : src,
          altText: blob.filename,
          contentType: blob.content_type,
          fileName: blob.filename,
          fileSize: blob.byte_size,
          width: image?.naturalWidth,
          previewable: blob.previewable,
          height: image?.naturalHeight
        }))
      }
    }, { tag: HISTORY_MERGE_TAG })
  }

  async #loadFigurePreviewFromBlob(blob, figure) {
    if (blob.previewable) {
      return new Promise((resolve) => {
        this.editor.update(() => {
          const image = this.#createDOMForImage()
          image.addEventListener("load", () => {
            resolve()
          })
          image.src = blob.url
          figure.insertBefore(image, figure.firstChild)
        })
      })
    } else {
      return Promise.resolve()
    }
  }
}
