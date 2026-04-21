import Lexxy from "../config/lexxy"
import { ActionTextAttachmentNode } from "./action_text_attachment_node"
import { createElement, dispatch } from "../helpers/html_helper"
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
    const { file, uploadUrl, blobUrlTemplate, progress, width, height, uploadError, fileName, contentType } = node
    super({ ...node, contentType: file?.type ?? contentType }, key)
    this.file = file ?? null
    this.fileName = file?.name ?? fileName
    this.uploadUrl = uploadUrl
    this.blobUrlTemplate = blobUrlTemplate
    this.progress = progress ?? null
    this.width = width
    this.height = height
    this.uploadError = uploadError
  }

  createDOM() {
    if (this.uploadError) return this.createDOMForError()

    // This side-effect is trigged on DOM load to fire only once and avoid multiple
    // uploads through cloning. The upload is guarded from restarting in case the
    // node is reloaded from saved state such as from history.
    this.#startUploadIfNeeded()

    // Bridge-managed uploads (uploadUrl is null) don't have file data to show
    // an image preview, so always show the file icon during upload.
    const canPreviewFile = this.isPreviewableAttachment && this.uploadUrl != null
    const figure = this.createAttachmentFigure(canPreviewFile)

    if (canPreviewFile) {
      const img = figure.appendChild(this.#createDOMForImage())

      // load file locally to set dimensions and prevent vertical shifting
      loadFileIntoImage(this.file, img).then(img => this.#setDimensionsFromImage(img))
    } else {
      figure.appendChild(this.#createDOMForFile())
    }

    figure.appendChild(this.#createCaption())
    figure.appendChild(this.#createProgressBar())

    return figure
  }

  updateDOM(prevNode, dom) {
    if (this.uploadError !== prevNode.uploadError) return true

    if (prevNode.progress !== this.progress) {
      const progress = dom.querySelector("progress")
      progress.value = this.progress ?? 0
    }

    return false
  }

  exportDOM() {
    return { element: null }
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "action_text_attachment_upload",
      version: 1,
      fileName: this.fileName,
      contentType: this.contentType,
      uploadUrl: this.uploadUrl,
      blobUrlTemplate: this.blobUrlTemplate,
      progress: this.progress,
      width: this.width,
      height: this.height,
      uploadError: this.uploadError
    }
  }

  get #uploadStarted() {
    return this.progress !== null
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
    return (this.fileName || "").split(".").pop().toLowerCase()
  }

  #createCaption() {
    const figcaption = createElement("figcaption", { className: "attachment__caption" })

    const nameSpan = createElement("span", { className: "attachment__name", textContent: this.caption || this.fileName || "" })
    const sizeSpan = createElement("span", { className: "attachment__size", textContent: bytesToHumanSize(this.file?.size) })
    figcaption.appendChild(nameSpan)
    figcaption.appendChild(sizeSpan)

    return figcaption
  }

  #createProgressBar() {
    return createElement("progress", { value: this.progress ?? 0, max: 100 })
  }

  #setDimensionsFromImage({ width, height }) {
    if (this.#hasDimensions) return

    this.patchAndRewriteHistory({ width, height })
  }

  get #hasDimensions() {
    return Boolean(this.width && this.height)
  }

  async #startUploadIfNeeded() {
    if (this.#uploadStarted) return
    if (!this.uploadUrl) return // Bridge-managed upload — skip DirectUpload

    this.#setUploadStarted()

    const { DirectUpload } = await import("@rails/activestorage")

    const upload = new DirectUpload(this.file, this.uploadUrl, this)
    upload.delegate = this.#createUploadDelegate()

    this.#dispatchEvent("lexxy:upload-start", { file: this.file })

    upload.create((error, blob) => {
      if (error) {
        this.#dispatchEvent("lexxy:upload-end", { file: this.file, error })
        this.#handleUploadError(error)
      } else {
        this.#dispatchEvent("lexxy:upload-end", { file: this.file, error: null })
        this.editor.update(() => {
          this.$showUploadedAttachment(blob)
        })
      }
    })
  }

  #createUploadDelegate() {
    const shouldAuthenticateUploads = Lexxy.global.get("authenticatedUploads")

    return {
      directUploadWillCreateBlobWithXHR: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true
      },
      directUploadWillStoreFileWithXHR: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true

        const uploadProgressHandler = (event) => this.#handleUploadProgress(event, request)
        request.upload.addEventListener("progress", uploadProgressHandler)
      }
    }
  }

  #setUploadStarted() {
    this.#setProgress(1)
  }

  #handleUploadProgress(event, request) {
    const progress = Math.round(event.loaded / event.total * 100)
    try {
      this.#setProgress(progress)
      this.#dispatchEvent("lexxy:upload-progress", { file: this.file, progress })
    } catch {
      request.abort()
    }
  }

  #setProgress(progress) {
    this.patchAndRewriteHistory({ progress })
  }

  #handleUploadError(error) {
    console.warn(`Upload error for ${this.file?.name ?? "file"}: ${error}`)

    this.patchAndRewriteHistory({ uploadError: true })
  }

  $showUploadedAttachment(blob) {
    const previewSrc = this.isPreviewableImage && this.file ? URL.createObjectURL(this.file) : null

    const replacementNode = this.#toActionTextAttachmentNodeWith(blob, previewSrc)
    this.replaceAndRewriteHistory(replacementNode)

    return replacementNode.getKey()
  }

  #toActionTextAttachmentNodeWith(blob, previewSrc) {
    const conversion = new AttachmentNodeConversion(this, blob, previewSrc)
    return conversion.toAttachmentNode()
  }

  #dispatchEvent(name, detail) {
    const figure = this.editor.getElementByKey(this.getKey())
    if (figure) dispatch(figure, name, detail)
  }
}

class AttachmentNodeConversion {
  constructor(uploadNode, blob, previewSrc) {
    this.uploadNode = uploadNode
    this.blob = blob
    this.previewSrc = previewSrc
  }

  toAttachmentNode() {
    return new ActionTextAttachmentNode({
      ...this.uploadNode,
      ...this.#propertiesFromBlob,
      src: this.#src,
      previewSrc: this.previewSrc,
      pendingPreview: this.blob.previewable && !this.uploadNode.isPreviewableImage
    })
  }

  get #propertiesFromBlob() {
    const { blob } = this
    return {
      sgid: blob.attachable_sgid,
      altText: blob.filename,
      contentType: blob.content_type,
      fileName: blob.filename,
      fileSize: blob.byte_size,
      previewable: blob.previewable,
    }
  }

  get #src() {
    return this.blob.previewable ? this.blob.url : this.#blobSrc
  }

  get #blobSrc() {
    return this.uploadNode.blobUrlTemplate
      .replace(":signed_id", this.blob.signed_id)
      .replace(":filename", encodeURIComponent(this.blob.filename))
  }
}

export function $createActionTextAttachmentUploadNode(...args) {
  return new ActionTextAttachmentUploadNode(...args)
}
