import { ElementNode } from "lexical"
import { $descendantsMatching, $getNearestNodeOfType, $wrapNodeInElement } from "@lexical/utils"

import { $isActionTextAttachmentNode, ActionTextAttachmentNode } from "./action_text_attachment_node"

export class ImageGalleryNode extends ElementNode {
  $config() {
    return this.config("image_gallery", { extends: ElementNode })
  }

  static importDOM() {
    return {
      div: (element) => {
        const containsAttachment = element.querySelector(ActionTextAttachmentNode.TAG_NAME)
        if (!containsAttachment) return null

        return {
          conversion: () => {
            return {
              node: $createImageGalleryNode(),
              after: children => $descendantsMatching(children, $isActionTextAttachmentNode)
            }
          },
          priority: 2
        }
      }
    }
  }

  createDOM() {
    const element = this.exportDOM().element
    element.classList.add("lexxy-image-gallery")
    return element
  }

  updateDOM() {
    return false
  }

  canBeEmpty() {
    return false
  }

  collapseAtStart() {
    return true
  }

  canInsertTextBefore() {
    return false
  }

  canInsertTextAfter() {
    return false
  }

  select(_anchorOffset, focusOffset = 0) {
    if (focusOffset > this.getChildrenSize()) {
      this.getLastChild().select()
    } else {
      this.getChildAtIndex(focusOffset)?.select()
    }
  }

  selectStart() {
    return this.selectPrevious(0, 0)
  }

  selectEnd() {
    return this.selectNext(0, 0)
  }

  getImageAttachments() {
    const children = this.getChildren()
    return children.filter($isActionTextAttachmentNode)
  }

  exportDOM() {
    const div = document.createElement("div")
    div.className = "attachment-gallery"
    return { element: div }
  }
}

export function $createImageGalleryNode() {
  return new ImageGalleryNode()
}

export function $isImageGalleryNode(node) {
  return node instanceof ImageGalleryNode
}

export function $findOrCreateGalleryFor(node) {
  const existingGallery = $getNearestNodeOfType(node, ImageGalleryNode)
  return existingGallery || $wrapNodeInElement(node, $createImageGalleryNode)
}
