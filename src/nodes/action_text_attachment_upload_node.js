import Lexxy from "../config/lexxy"
import { SILENT_UPDATE_TAGS } from "../helpers/lexical_helper"
import { ActionTextAttachmentNode } from "./action_text_attachment_node"
import { createElement } from "../helpers/html_helper"
import { loadFileIntoImage } from "../helpers/upload_helper"
import { bytesToHumanSize } from "../helpers/storage_helper"
import { optimizeImage } from "../helpers/image_optimization_helper"

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
    const { file, uploadUrl, blobUrlTemplate, progress, width, height, uploadError } = node
    super({ ...node, contentType: file.type }, key)
    this.file = file
    this.uploadUrl = uploadUrl
    this.blobUrlTemplate = blobUrlTemplate
    this.progress = progress ?? null
    this.width = width
    this.height = height
    this.uploadError = uploadError
  }

  createDOM() {
    if (this.uploadError) return this.#createDOMForError()

    const figure = this.createAttachmentFigure()

    if (this.isPreviewableAttachment) {
      const img = figure.appendChild(this.#createDOMForImage())

      const optimizationConfig = Lexxy.global.get("imageOptimization") ?? { enabled: false }
      const optimizationEnabled = optimizationConfig.enabled && this.file.type.startsWith("image/")

      if (optimizationEnabled) {
        this.#loadAndOptimizePreview(img, optimizationConfig).finally(() => {
          this.#setDimensionsFromImage(img)
          this.#startUploadIfNeeded()
        })
      } else {
        loadFileIntoImage(this.file, img).then(() => this.#setDimensionsFromImage(img))
        this.#startUploadIfNeeded()
      }
    } else {
      figure.appendChild(this.#createDOMForFile())
      this.#startUploadIfNeeded()
    }

    figure.appendChild(this.#createCaption())
    figure.appendChild(this.#createProgressBar())

    return figure
  }

  updateDOM(prevNode, dom) {
    if (this.uploadError !== prevNode.uploadError) return true

    if (prevNode.progress !== this.progress) {
      const progress = dom.querySelector("progress")
      if (progress) progress.value = this.progress ?? 0
    }

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

  #createDOMForError() {
    const figure = this.createAttachmentFigure()
    figure.classList.add("attachment--error")
    figure.appendChild(createElement("div", { innerText: `Error uploading ${this.file?.name ?? "file"}` }))
    return figure
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

  #createProgressBar() {
    return createElement("progress", { value: this.progress ?? 0, max: 100 })
  }

  #setDimensionsFromImage({ naturalWidth: width, naturalHeight: height }) {
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

  async #loadAndOptimizePreview(image, config) {
    try {
      const result = await optimizeImage(this.file, config)

      if (!result) {
        return loadFileIntoImage(this.file, image)
      }

      this.optimizedFile = result.optimizedFile
      image.src = result.previewUrl

      return new Promise((resolve) => {
        const cleanup = () => {
          image.onload = null
          image.onerror = null
          resolve()
        }

        if (image.complete && image.naturalWidth > 0) {
          cleanup()
        } else {
          image.onload = cleanup
          image.onerror = () => {
            console.warn("Optimized preview failed to load, falling back")
            loadFileIntoImage(this.file, image).then(cleanup)
          }
        }
      })
    } catch (err) {
      console.warn("Optimization failed:", err)
      return loadFileIntoImage(this.file, image)
    }
  }

  async #startUploadIfNeeded() {
    if (this.#uploadStarted) return

    this.#setUploadStarted()

    const { DirectUpload } = await import("@rails/activestorage")

    const fileToUpload = this.optimizedFile ?? this.file
    const upload = new DirectUpload(fileToUpload, this.uploadUrl, this)

    upload.delegate = this.#createUploadDelegate()
    upload.create((error, blob) => {
      if (error) {
        this.#handleUploadError(error)
      } else {
        this.#showUploadedAttachment(blob)
      }
    })
  }

  #createUploadDelegate() {
    const shouldAuthenticateUploads = Lexxy.global.get("authenticatedUploads")

    return {
      directUploadWillCreateBlobWithXHR: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true
      },
      directUploadWillStoreFileWithXhr: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true

        const uploadProgressHandler = (event) => this.#handleUploadProgress(event)
        request.upload.addEventListener("progress", uploadProgressHandler)
      }
    }
  }

  #setUploadStarted() {
    this.#setProgress(1)
  }

  #handleUploadProgress(event) {
    this.#setProgress(Math.round(event.loaded / event.total * 100))
  }

  #setProgress(progress) {
    this.editor.update(() => {
      this.getWritable().progress = progress
    }, { tag: SILENT_UPDATE_TAGS })
  }

  #handleUploadError(error) {
    console.warn(`Upload error for ${this.file?.name ?? "file"}: ${error}`)
    this.editor.update(() => {
      this.getWritable().uploadError = true
    }, { tag: SILENT_UPDATE_TAGS })
  }

  async #showUploadedAttachment(blob) {
    this.editor.update(() => {
      this.replace(this.#toActionTextAttachmentNodeWith(blob))
    }, { tag: SILENT_UPDATE_TAGS })
  }

  #toActionTextAttachmentNodeWith(blob) {
    const conversion = new AttachmentNodeConversion(this, blob)
    return conversion.toAttachmentNode()
  }
}

class AttachmentNodeConversion {
  constructor(uploadNode, blob) {
    this.uploadNode = uploadNode
    this.blob = blob
  }

  toAttachmentNode() {
    return new ActionTextAttachmentNode({
      ...this.uploadNode,
      ...this.#propertiesFromBlob,
      src: this.#src,
      width: this.uploadNode.width,
      height: this.uploadNode.height
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