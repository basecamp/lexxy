import { ElementNode } from "lexical"

export class AttachmentGalleryNode extends ElementNode {
  static getType() {
    return "attachment_gallery"
  }

  static clone(node) {
    return new AttachmentGalleryNode(node.__key)
  }

  static importJSON(serializedNode) {
    return new AttachmentGalleryNode()
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (domNode.classList.contains('attachment-gallery')) {
          return {
            conversion: () => ({ node: new AttachmentGalleryNode() }),
            priority: 1
          }
        }
        return null
      }
    }
  }

  constructor(key) {
    super(key)
  }

  createDOM() {
    const element = document.createElement("div")
    element.className = this.getGalleryClassName()
    return element
  }

  updateDOM(prevNode, dom) {
    const className = this.getGalleryClassName()
    if (dom.className !== className) {
      dom.className = className
      return true
    }
    return false
  }

  getGalleryClassName() {
    const count = this.getChildrenSize()
    return `attachment-gallery attachment-gallery--${count}`
  }

  isInline() {
    return false
  }

  exportDOM(editor) {
    const element = document.createElement("div")
    element.className = this.getGalleryClassName()
    return { element }
  }

  exportJSON() {
    return {
      type: "attachment_gallery",
      version: 1
    }
  }
}

export function $createAttachmentGalleryNode() {
  return new AttachmentGalleryNode()
}
