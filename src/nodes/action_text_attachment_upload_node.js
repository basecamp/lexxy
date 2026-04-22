import {
  $createParagraphNode, $getNodeByKey, $getRoot, $getSelection, $isRangeSelection, $isRootOrShadowRoot, HISTORIC_TAG, HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG,
  SKIP_SCROLL_INTO_VIEW_TAG
} from "lexical"
import Lexxy from "../config/lexxy"
import { ActionTextAttachmentNode } from "./action_text_attachment_node"
import { $isProvisionalParagraphNode } from "./provisional_paragraph_node"
import { createElement, dispatch } from "../helpers/html_helper"
import { loadFileIntoImage } from "../helpers/upload_helper"
import { bytesToHumanSize } from "../helpers/storage_helper"

export class ActionTextAttachmentUploadNode extends ActionTextAttachmentNode {
  static #activeUploads = new WeakSet()

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
    this.fileName = file.name
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
    return this.file.name.split(".").pop().toLowerCase()
  }

  #createCaption() {
    const figcaption = createElement("figcaption", { className: "attachment__caption" })

    const nameSpan = createElement("span", { className: "attachment__name", textContent: this.caption || this.file.name || "" })
    const sizeSpan = createElement("span", { className: "attachment__size", textContent: bytesToHumanSize(this.file.size) })
    figcaption.appendChild(nameSpan)
    figcaption.appendChild(sizeSpan)

    return figcaption
  }

  #createProgressBar() {
    return createElement("progress", { value: this.progress ?? 0, max: 100 })
  }

  #setDimensionsFromImage({ width, height }) {
    if (this.#hasDimensions) return

    this.editor.update(() => {
      const writable = this.getWritable()
      writable.width = width
      writable.height = height
    }, { tag: this.#transientUpdateTags })
  }

  get #hasDimensions() {
    return Boolean(this.width && this.height)
  }

  async #startUploadIfNeeded() {
    if (this.#uploadStarted) return
    if (!this.uploadUrl) return // Bridge-managed upload — skip DirectUpload
    if (ActionTextAttachmentUploadNode.#activeUploads.has(this.file)) return

    ActionTextAttachmentUploadNode.#activeUploads.add(this.file)
    const uploadNodeKey = this.getKey()
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
          const uploadNode = $getNodeByKey(uploadNodeKey)
          if (!(uploadNode instanceof ActionTextAttachmentUploadNode)) return

          uploadNode.showUploadedAttachment(blob)
        }, {
          tag: this.#backgroundUpdateTags,
          onUpdate: () => requestAnimationFrame(() => this.#collapseUploadHistory(uploadNodeKey))
        })
      }
    })
  }

  // Upload completion uses HISTORY_PUSH_TAG so Lexical creates the undo boundary.
  // Then we rewrite any upload-node snapshots to their clean (node-stripped) form
  // and collapse duplicates to avoid no-op undo steps.
  #collapseUploadHistory(uploadNodeKey) {
    const historyState = this.#historyState
    if (!historyState) return

    const currentSignature = historyState.current && this.#contentSignatureFor(historyState.current.editorState)
    const rewrittenStack = []
    let prevSignature = null

    for (const entry of historyState.undoStack) {
      const hasUploadNode = entry.editorState.read(() =>
        $getNodeByKey(uploadNodeKey) instanceof ActionTextAttachmentUploadNode
      )

      const editorState = hasUploadNode
        ? this.#editorStateStrippingUploadNodes(entry.editorState)
        : entry.editorState

      const signature = this.#contentSignatureFor(editorState)
      if (signature !== prevSignature && signature !== currentSignature) {
        rewrittenStack.push(hasUploadNode ? { editor: entry.editor, editorState } : entry)
      }
      prevSignature = signature
    }

    historyState.undoStack = rewrittenStack
    historyState.redoStack = []

    // Force listeners (toolbar undo/redo button states) to observe the stack rewrite.
    this.editor.update(() => {}, { tag: HISTORIC_TAG })
  }

  // Upload nodes can't survive a JSON round-trip (File isn't serializable),
  // so strip them from the serialized state before parseEditorState calls importJSON.
  #editorStateStrippingUploadNodes(editorState) {
    const json = editorState.toJSON()
    this.#stripNodesFromJSON(json.root, n => n.type === "action_text_attachment_upload")
    return this.editor.parseEditorState(json, () => {
      if ($getRoot().getChildrenSize() === 0) $getRoot().append($createParagraphNode())
    })
  }

  #stripNodesFromJSON(node, predicate) {
    if (!node.children) return
    node.children = node.children.filter(child => {
      if (predicate(child)) return false
      this.#stripNodesFromJSON(child, predicate)
      return true
    })
  }

  #contentSignatureFor(editorState) {
    return JSON.stringify(editorState.toJSON().root)
  }

  get #historyState() {
    return this.editor.getRootElement()?.closest("lexxy-editor")?.historyState
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
    this.editor.update(() => {
      this.getWritable().progress = progress
    }, { tag: this.#transientUpdateTags })
  }

  #handleUploadError(error) {
    console.warn(`Upload error for ${this.file?.name ?? "file"}: ${error}`)
    this.editor.update(() => {
      this.getWritable().uploadError = true
    }, { tag: this.#transientUpdateTags })
  }

  showUploadedAttachment(blob) {
    const previewSrc = this.isPreviewableImage && this.file ? URL.createObjectURL(this.file) : null

    const replacementNode = this.#toActionTextAttachmentNodeWith(blob, previewSrc)
    const shouldSelectAfterReplacement = this.#selectionIncludesUploadNode
    this.replace(replacementNode)

    if (shouldSelectAfterReplacement && $isRootOrShadowRoot(replacementNode.getParent())) {
      replacementNode.selectNext()
    }

    return replacementNode.getKey()
  }

  // Transient updates (progress, dimensions, errors) are completely invisible to
  // the undo history via HISTORIC_TAG.
  get #transientUpdateTags() {
    if (this.#editorHasFocus) {
      return [ HISTORIC_TAG ]
    } else {
      return [ HISTORIC_TAG, SKIP_DOM_SELECTION_TAG ]
    }
  }

  // Use HISTORY_PUSH_TAG to force a stable undo boundary at upload completion.
  // SKIP_SCROLL_INTO_VIEW_TAG avoids scroll jumps, and SKIP_DOM_SELECTION_TAG
  // prevents focus theft when the editor is not active.
  get #backgroundUpdateTags() {
    if (this.#editorHasFocus) {
      return [ HISTORY_PUSH_TAG, SKIP_SCROLL_INTO_VIEW_TAG ]
    } else {
      return [ HISTORY_PUSH_TAG, SKIP_SCROLL_INTO_VIEW_TAG, SKIP_DOM_SELECTION_TAG ]
    }
  }

  get #editorHasFocus() {
    const rootElement = this.editor.getRootElement()
    return rootElement !== null && rootElement.contains(document.activeElement)
  }

  get #selectionIncludesUploadNode() {
    const selection = $getSelection()
    if (selection === null) return false

    if (selection.getNodes().some((node) => node.is(this))) return true
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

    const anchorNode = selection.anchor.getNode()
    if (!$isProvisionalParagraphNode(anchorNode) || !anchorNode.isEmpty()) return false

    const previousSibling = anchorNode.getPreviousSibling()
    return previousSibling !== null && previousSibling.is(this)
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
