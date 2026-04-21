import { $getNodeByKey, $getSelection } from "lexical"
import { isPreviewableImage } from "../../helpers/html_helper"
import { $createActionTextAttachmentNode, $isActionTextAttachmentNode } from "../../nodes/action_text_attachment_node"
import { $createImageGalleryNode, $findOrCreateGalleryForImage, ImageGalleryNode } from "../../nodes/image_gallery_node"
import { $getNearestNodeOfType } from "@lexical/utils"
import Lexxy from "../../config/lexxy"
import { dispatch } from "../../helpers/html_helper"
import { SILENT_UPDATE_TAGS } from "../../helpers/lexical_helper"

export default class Uploader {
  #files

  static for(editorElement, files) {
    const UploaderKlass = GalleryUploader.handle(editorElement, files) ? GalleryUploader : Uploader
    return new UploaderKlass(editorElement, files)
  }

  constructor(editorElement, files) {
    this.#files = files

    this.editorElement = editorElement
    this.contents = editorElement.contents
    this.selection = editorElement.selection
  }

  get files() {
    return Array.from(this.#files)
  }

  // Insert nodes immediately, then upload in the background.
  // Called inside editor.update().
  $insertAndUpload() {
    this.$createNodes()
    this.$insertNodes()

    // Kick off uploads after nodes are in the document.
    // Each upload updates its node with sgid when complete.
    const entries = this.nodes.map((node, i) => [ node.getKey(), this.files[i] ])
    setTimeout(() => this.#uploadAll(entries), 0)
  }

  $createNodes() {
    this.nodes = this.files.map(file =>
      $createActionTextAttachmentNode({
        fileName: file.name,
        contentType: file.type
      })
    )
  }

  $insertNodes() {
    this.contents.insertAtCursor(...this.nodes)
  }

  async #uploadAll(entries) {
    await Promise.all(entries.map(([ nodeKey, file ]) => this.#uploadFile(nodeKey, file)))
  }

  async #uploadFile(nodeKey, file) {
    const uploadUrl = this.editorElement.directUploadUrl
    if (!uploadUrl) return

    dispatch(this.editorElement, "lexxy:upload-start", { file })

    try {
      const { DirectUpload } = await import("@rails/activestorage")
      const upload = new DirectUpload(file, uploadUrl, this.#createDelegate(file))

      const blob = await new Promise((resolve, reject) => {
        upload.create((error, blob) => error ? reject(error) : resolve(blob))
      })

      this.#applyBlob(nodeKey, blob)
      dispatch(this.editorElement, "lexxy:upload-end", { file, error: null })
    } catch (error) {
      console.warn(`Upload error for ${file.name}: ${error}`)
      dispatch(this.editorElement, "lexxy:upload-end", { file, error })
    }
  }

  #applyBlob(nodeKey, blob) {
    this.editorElement.editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (!node || !$isActionTextAttachmentNode(node)) return

      const writable = node.getWritable()
      writable.sgid = blob.attachable_sgid
      writable.src = blob.previewable ? blob.url : this.#blobSrc(blob)
      writable.contentType = blob.content_type
      writable.fileName = blob.filename
      writable.fileSize = blob.byte_size
      writable.previewable = blob.previewable
    }, { tag: SILENT_UPDATE_TAGS })
  }

  #createDelegate(file) {
    const shouldAuthenticate = Lexxy.global.get("authenticatedUploads")

    return {
      directUploadWillCreateBlobWithXHR: (request) => {
        if (shouldAuthenticate) request.withCredentials = true
      },
      directUploadWillStoreFileWithXHR: (request) => {
        if (shouldAuthenticate) request.withCredentials = true

        request.upload.addEventListener("progress", (event) => {
          const progress = Math.round(event.loaded / event.total * 100)
          dispatch(this.editorElement, "lexxy:upload-progress", { file, progress })
        })
      }
    }
  }

  #blobSrc(blob) {
    const template = this.editorElement.blobUrlTemplate
    if (!template) return null
    return template
      .replace(":signed_id", blob.signed_id)
      .replace(":filename", encodeURIComponent(blob.filename))
  }
}

class GalleryUploader extends Uploader {
  #gallery

  static handle(editorElement, files) {
    return this.#isMultipleImageUpload(files) || this.#gallerySelection(editorElement.selection)
  }

  static #isMultipleImageUpload(files) {
    let imageFileCount = 0
    for (const file of files) {
      if (isPreviewableImage(file.type)) imageFileCount++
      if (imageFileCount > 1) return true
    }
    return false
  }

  static #gallerySelection(selection) {
    if (selection.isOnPreviewableImage) return true

    const { node: selectedNode } = selection.selectedNodeWithOffset()
    return $getNearestNodeOfType(selectedNode, ImageGalleryNode) !== null
  }

  $insertNodes() {
    this.#findOrCreateGallery()
    this.#insertImagesInGallery()
    this.#insertNonImagesAfterGallery()
  }

  #findOrCreateGallery() {
    if (this.selection.isOnPreviewableImage) {
      this.#gallery = $findOrCreateGalleryForImage(this.#selectedNode)
    } else {
      this.#gallery = $createImageGalleryNode()
      this.contents.insertAtCursor(this.#gallery)
    }
  }

  get #selectedNode() {
    const { node } = this.selection.selectedNodeWithOffset()
    return node
  }

  get #galleryInsertPosition() {
    const anchor = $getSelection()?.anchor
    const galleryHasElementSelection = anchor?.getNode().is(this.#gallery)
    if (galleryHasElementSelection) return anchor.offset

    const selectedNode = this.#selectedNode
    const childIndex = this.#gallery.isParentOf(selectedNode) && selectedNode.getIndexWithinParent()
    return childIndex !== false ? (childIndex + 1) : 0
  }

  get #imageNodes() {
    return this.nodes.filter(node => ImageGalleryNode.isValidChild(node))
  }

  get #nonImageNodes() {
    return this.nodes.filter(node => !ImageGalleryNode.isValidChild(node))
  }

  #insertImagesInGallery() {
    this.#gallery.splice(this.#galleryInsertPosition, 0, this.#imageNodes)
  }

  #insertNonImagesAfterGallery() {
    let beforeNode = this.#gallery

    for (const node of this.#nonImageNodes) {
      beforeNode.insertAfter(node)
      beforeNode = node
    }
  }
}
