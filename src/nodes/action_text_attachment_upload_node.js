import Lexxy from "../config/lexxy"
import { HISTORY_MERGE_TAG } from "lexical"
import { DirectUpload } from "@rails/activestorage"
import { ActionTextAttachmentNode } from "./action_text_attachment_node"
import { createElement } from "../helpers/html_helper"
import { loadFileIntoImage } from "../helpers/upload_helper"
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

  // Should never run since this is a transient node. Defined to remove console warning.
  static importDOM() {
    return null
  }

  constructor(node, key) {
    const { file, uploadUrl, blobUrlTemplate, editor, progress } = node
    super({ ...node, contentType: file.type }, key)
    this.file = file
    this.uploadUrl = uploadUrl
    this.blobUrlTemplate = blobUrlTemplate
    this.editor = editor
    this.progress = progress ?? null

    if (!this.#uploadStarted) {
      this.#startUpload()
    }
  }

  get #uploadStarted() {
    return this.progress !== null
  }

  createDOM() {
    const figure = this.createAttachmentFigure()

    if (this.isPreviewableAttachment) {
      const img = this.#createDOMForImage()
      figure.appendChild(img)

      // load file locally and set dimensions to prevent vertical shifting
      loadFileIntoImage(this.file, img).then((img) => this.#setDimensionsFrom(img))
    } else {
      figure.appendChild(this.#createDOMForFile())
    }

    figure.appendChild(this.#createCaption())
    figure.appendChild(this.#createProgressBar())

    return figure
  }

  updateDOM(_prevNode, dom) {
    const progress = dom.querySelector("progress")
    progress.value = this.progress ?? 0

    return false
  }

  #setDimensionsFrom({ width, height }) {
    if (!this.width && !this.height) {
      this.editor.update(() => {
        const writable = this.getWritable()
        writable.height = height
        writable.width = width
      })
    }
  }

  exportDOM() {
    return { element: null }
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "action_text_attachment_upload",
      version: 1,
      progress: this.progress,
      uploadUrl: this.uploadUrl,
      blobUrlTemplate: this.blobUrlTemplate,
    }
  }

  #createDOMForImage() {
    return createElement("img", { altText: this.altText })
  }

  #createDOMForFile() {
    const extension = this.#getFileExtension()
    const span = createElement("span", { className: "attachment__icon", textContent: extension })
    return span
  }

  #createProgressBar() {
    return createElement("progress", { value: this.progress ?? 0, max: 100 })
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

  #startUpload(figure) {
    const shouldAuthenticateUploads = Lexxy.global.get("authenticatedUploads")

    const upload = new DirectUpload(this.file, this.uploadUrl, this)

    upload.delegate = {
      directUploadWillCreateBlobWithXHR: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true
      },
      directUploadWillStoreFileWithXHR: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true

        const uploadProgressHandler = (event) => this.#handleUploadProgress(event)
        request.upload.addEventListener("progress", uploadProgressHandler)
      }
    }

    this.#markUploadStart()

    upload.create((error, blob) => {
      if (error) {
        this.#handleUploadError(figure)
      } else {
        this.#showUploadedAttachment(blob)
      }
    })
  }

  #markUploadStart() {
    this.editor.update(() => {
      this.getWritable().progress = 1
    }, { tag: HISTORY_MERGE_TAG })
  }

  #handleUploadProgress(event) {
    this.editor.update(() => {
      const latest = this.getWritable()
      latest.progress = Math.round(event.loaded / event.total * 100)
    }, { tag: HISTORY_MERGE_TAG })
  }

  #handleUploadError(figure) {
    figure.innerHTML = ""
    figure.classList.add("attachment--error")
    figure.appendChild(createElement("div", { innerText: `Error uploading ${this.file?.name ?? "image"}` }))
  }

  #showUploadedAttachment(blob) {
    this.editor.update(() => {
      const latest = this.getLatest()
      if (latest) {
        const attachmentNode = this.#toAttachmentNode(blob)
        latest.replace(attachmentNode)
      }
    })
  }

  #toAttachmentNode(blob) {
    const latest = this.getLatest()
    return new ActionTextAttachmentNode({
      tagName: this.tagName,
      sgid: blob.attachable_sgid,
      src: blob.previewable ? blob.url : this.#getBlobSrc(blob),
      altText: blob.filename,
      contentType: blob.content_type,
      fileName: blob.filename,
      fileSize: blob.byte_size,
      previewable: blob.previewable,
      height: latest.height,
      width: latest.width,
    })
  }

  #getBlobSrc(blob) {
    return this.blobUrlTemplate
      .replace(":signed_id", blob.signed_id)
      .replace(":filename", encodeURIComponent(blob.filename))
  }
}

export function $createActionTextAttachmentUploadNode(...args) {
  return new ActionTextAttachmentUploadNode(...args)
}
