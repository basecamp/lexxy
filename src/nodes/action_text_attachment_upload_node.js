import Lexxy from "../config/lexxy"
import { SILENT_UPDATE_TAGS } from "../helpers/lexical_helper"
import { $getNodeByKey } from "lexical"
import { $getEditor } from "lexical"
import { ActionTextAttachmentNode } from "./action_text_attachment_node"
import { createElement } from "../helpers/html_helper"
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

  // Should never run since this is a transient node. Defined to remove console warning.
  static importDOM() {
    return null
  }

  constructor(node, key) {
    const { file, uploadUrl, blobUrlTemplate, progress, width, height } = node
    super({ ...node, contentType: file.type }, key)
    this.file = file
    this.uploadUrl = uploadUrl
    this.blobUrlTemplate = blobUrlTemplate
    this.progress = progress || 0
    this.width = width
    this.height = height

    this.editor = $getEditor()
  }

  createDOM() {
    const figure = this.createAttachmentFigure()

    if (this.isPreviewableAttachment) {
      const img = figure.appendChild(this.#createDOMForImage())

      // load file locally to set dimensions and prevent vertical shifting
      loadFileIntoImage(this.file, img).then(img => this.#setDimensionsFrom(img))
    } else {
      figure.appendChild(this.#createDOMForFile())
    }

    figure.appendChild(this.#createCaption())

    const progressBar = createElement("progress", { value: this.progress, max: 100 })
    figure.appendChild(progressBar)

    this.#startUpload(progressBar, figure)

    return figure
  }

  updateDOM() {
    return false
  }

  exportDOM() {
    const img = document.createElement("img")
    return { element: img }
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "action_text_attachment_upload",
      version: 1,
      progress: this.progress,
      uploadUrl: this.uploadUrl,
      blobUrlTemplate: this.blobUrlTemplate,
      width: this.width,
      height: this.height
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

  #setDimensionsFrom({ width, height }) {
    if (this.#hasDimensions) return

    this.editor.update(() => {
      const writable = this.getWritable()
      writable.width = width
      writable.height = height
    }, { tag: SILENT_UPDATE_TAGS })
  }

  get #hasDimensions() {
    return Boolean(this.width && this.height)
  }

  async #startUpload(progressBar, figure) {
    const { DirectUpload } = await import("@rails/activestorage")
    const shouldAuthenticateUploads = Lexxy.global.get("authenticatedUploads")

    const upload = new DirectUpload(this.file, this.uploadUrl, this)

    upload.delegate = {
      directUploadWillCreateBlobWithXHR: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true
      },
      directUploadWillStoreFileWithXHR: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true

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
        this.#showUploadedAttachment(blob)
      }
    })
  }

  #handleUploadError(figure) {
    figure.innerHTML = ""
    figure.classList.add("attachment--error")
    figure.appendChild(createElement("div", { innerText: `Error uploading ${this.file?.name ?? "image"}` }))
  }

  async #showUploadedAttachment(blob) {
    this.editor.update(() => {
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
          previewable: blob.previewable,
          width: this.width,
          height: this.height
        }))
      }
    }, { tag: HISTORY_MERGE_TAG })
  }
}
