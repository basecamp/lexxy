import { $isRangeSelection, ElementNode } from "lexical"
import { $descendantsMatching, $getNearestNodeOfType, $wrapNodeInElement } from "@lexical/utils"

import { $isActionTextAttachmentNode, ActionTextAttachmentNode } from "./action_text_attachment_node"

export class ImageGalleryNode extends ElementNode {
  $config() {
    return this.config("image_gallery", { extends: ElementNode })
  }

  static importDOM() {
    return {
      div: (element) => {
        const containsAttachment = element.querySelector(":scope > :where(img, video, " + ActionTextAttachmentNode.TAG_NAME + ")")
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
    const p = document.createElement("p")
    p.className = "attachment-gallery"
    p.classList.add("lexxy-image-gallery")
    return p
  }

  updateDOM() {
    return false
  }

  select(anchorOffset, focusOffset) {
    console.debug("select", anchorOffset, focusOffset)
    if (false && anchorOffset === undefined && focusOffset === undefined) {
      return this.selectNext(0, 0)
    }
    if (anchorOffset === 0 && focusOffset === 0) {
      return this.selectPrevious()
    }
    const childrenSize = this.getChildrenSize()
    if (false && anchorOffset === childrenSize || focusOffset === childrenSize) {
      return this.selectNext(0, 0)
    } else {
      return super.select(anchorOffset, focusOffset)
    }
  }

  canInsertTextAfter() {
    return false
  }

  canBeEmpty() {
    return false
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
