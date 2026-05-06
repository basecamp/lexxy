import { $getSelection } from "lexical"
import { isPreviewableImage } from "../../helpers/html_helper"
import { $createImageGalleryNode, $findOrCreateGalleryForImage, ImageGalleryNode } from "../../nodes/image_gallery_node"

export default class Uploader {
  #files

  static for(editorElement, files) {
    const UploaderKlass = GalleryUploader.handle(editorElement, files) ? GalleryUploader : Uploader
    return new UploaderKlass(editorElement, files)
  }

  constructor(editorElement, files, options = {}) {
    this.#files = files
    this.options = options

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
    this.nodes = this.files.map(file => this.contents.$createUploadNode(file))
  }

  $insertUploadNodes() {
    this.contents.insertAtCursor(...this.nodes)
  }
}

class GalleryUploader extends Uploader {
  #gallery

  static handle(editorElement, files) {
    return this.isMultipleImageUpload(files) || this.gallerySelection(editorElement.selection)
  }

  static isMultipleImageUpload(files) {
    let imageFileCount = 0
    for (const file of files) {
      if (isPreviewableImage(file.type)) imageFileCount++
      if (imageFileCount > 1) return true
    }
    return false
  }

  static gallerySelection(selection) {
    return selection.isOnPreviewableImage || this.selectionIsAfterGalleryEdge(selection)
  }

  static selectionIsAfterGalleryEdge(selection) {
    return selection.isAtNodeStart && ImageGalleryNode.canCollapseWith(selection.nodeBeforeCursor)
  }

  $insertUploadNodes() {
    this.#findOrCreateGallery()
    this.#insertImagesInGallery()
    this.#insertNonImagesAfterGallery()
  }

  #findOrCreateGallery() {
    if (this.selection.isOnPreviewableImage) {
      this.#gallery = $findOrCreateGalleryForImage(this.#selectedNode)
    } else if (this.#selectionIsAfterGalleryEdge) {
      this.#gallery = $findOrCreateGalleryForImage(this.selection.nodeBeforeCursor)
    } else {
      this.#gallery = $createImageGalleryNode()
      this.contents.insertAtCursor(this.#gallery)
    }
  }

  get #selectionIsAfterGalleryEdge() {
    return this.constructor.selectionIsAfterGalleryEdge(this.selection)
  }

  get #selectedNode() {
    const { node } = this.selection.selectedNodeWithOffset()
    return node
  }

  get #galleryInsertPosition() {
    if (this.#selectionIsAfterGalleryEdge) return this.#gallery.getChildrenSize()

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
