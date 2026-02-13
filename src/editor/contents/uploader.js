import { $getSelection, $getSiblingCaret } from "lexical"
import { isPreviewableImage } from "../../helpers/html_helper"
import { $createActionTextAttachmentUploadNode } from "../../nodes/action_text_attachment_upload_node"
import { $createImageGalleryNode, $findOrCreateGalleryForImage, ImageGalleryNode } from "../../nodes/image_gallery_node"
import { $getNearestNodeOfType } from "@lexical/utils"

export default class Uploader {
  #files

  static for(editorElement, files) {
    const { selection } = editorElement

    const isGalleryUpload = this.#isMultipleImageUpload(files) || selection.isOnPreviewableImage

    const Klass = isGalleryUpload ? GalleryUploader : Uploader
    return new Klass(editorElement, files)
  }

  static #isMultipleImageUpload(files) {
    let imageFileCount = 0
    for (const file of files) {
      if (isPreviewableImage(file.type)) imageFileCount++
      if (imageFileCount > 1) return true
    }
    return false
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

  $uploadFiles() {
    this.$createUploadNodes()
    this.$insertUploadNodes()
  }

  $createUploadNodes() {
    this.nodes = this.files.map(file =>
      $createActionTextAttachmentUploadNode({
        ...this.#nodeUrlProperties,
        file: file,
        contentType: file.type
      })
    )
  }

  $insertUploadNodes() {
    this.nodes.forEach(this.contents.insertAtCursor)
  }

  get #nodeUrlProperties() {
    return {
      uploadUrl: this.editorElement.directUploadUrl,
      blobUrlTemplate: this.editorElement.blobUrlTemplate
    }
  }
}

class GalleryUploader extends Uploader {
  #gallery

  $uploadFiles() {
    this.$createUploadNodes()
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
    const childIndex = this.#gallery?.isParentOf(selectedNode) && selectedNode.getIndexWithinParent()
    return childIndex ? (childIndex + 1) : 0
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
    const caret = $getSiblingCaret(this.#gallery, "next")

    for (const node of this.#nonImageNodes) {
      caret.insert(node)
      caret.getAdjacentCaret()
    }
  }
}
