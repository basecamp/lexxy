import { ElementNode, $createParagraphNode } from "lexical"
import { ActionTextAttachmentNode } from "./action_text_attachment_node"

export class ImageGalleryNode extends ElementNode {
  static getType() {
    return "image_gallery"
  }

  static clone(node) {
    return new ImageGalleryNode(node.__key)
  }

  static importJSON(serializedNode) {
    const node = new ImageGalleryNode()
    node. setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  static importDOM() {
    return {
      section: (node) => {
        if (node.classList.contains("lexxy-image-gallery")) {
          return {
            conversion: (element) => {
              return { node: new ImageGalleryNode() }
            },
            priority: 2
          }
        }
        return null
      }
    }
  }

  constructor(key) {
    super(key)
  }

  createDOM(config) {
    const section = document.createElement("section")
    section.className = "lexxy-image-gallery"
    return section
  }

  updateDOM(prevNode, dom, config) {
    return false
  }

  canBeEmpty() {
    return false
  }

  isShadowRoot() {
    return false
  }

  isInline() {
    return false
  }

  collapseAtStart() {
    return true
  }

  canInsertChild(child) {
    return child instanceof ActionTextAttachmentNode && this.#isImageAttachment(child)
  }

  #isImageAttachment(node) {
    return node.contentType && node.contentType.startsWith("image/")
  }

  canInsertTextBefore() {
    return false
  }

  canInsertTextAfter() {
    return false
  }

  getImageAttachments() {
    const children = this.getChildren()
    return children.filter(child => child instanceof ActionTextAttachmentNode)
  }

  isEmpty() {
    return this.getChildren().length === 0
  }

  exportDOM(editor) {
    const section = document.createElement("section")
    section.className = "lexxy-image-gallery"
    return { element: section }
  }

  exportJSON() {
    return {
      ... super.exportJSON(),
      type: "image_gallery",
      version: 1
    }
  }

  getTextContent() {
    const imageCount = this.getImageAttachments().length
    return `[Image Gallery: ${imageCount} image${imageCount !== 1 ? 's' : ''}]\n\n`
  }

  appendImageAttachment(attachmentNode) {
    if (attachmentNode instanceof ActionTextAttachmentNode && this.#isImageAttachment(attachmentNode)) {
      this.append(attachmentNode)
      return true
    }
    return false
  }
}

// Helper function to create a gallery node
export function $createImageGalleryNode() {
  return new ImageGalleryNode()
}

// Helper to check if a node is an image gallery
export function $isImageGalleryNode(node) {
  return node instanceof ImageGalleryNode
}