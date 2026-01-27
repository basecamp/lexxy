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
    p.className = this.#galleryClassNames
    p.style = "display: block; cursor: default; position: relative;"
    return p
  }

  updateDOM(_prevNode, dom) {
    dom.classList = this.#galleryClassNames
    return false
  }

  select(anchorOffset, focusOffset) {
    console.debug("select", anchorOffset, focusOffset)
    if (anchorOffset === undefined && focusOffset === undefined) {
      return this.selectNext(0, 0)
    }
    if (anchorOffset === 0 && focusOffset === 0) {
      return this.selectPrevious()
    }
    const childrenSize = this.getChildrenSize()
    if (anchorOffset === childrenSize || focusOffset === childrenSize) {
      return this.selectNext(0, 0)
    } else {
      return super.select(anchorOffset, focusOffset)
    }
  }

  canInsertTextAfter() {
    return true
  }

  canBeEmpty() {
    // lying to get the right behavior: a transform handles clean-up
    return true
  }

  getImageAttachments() {
    const children = this.getChildren()
    return children.filter($isActionTextAttachmentNode)
  }

  exportDOM() {
    const div = document.createElement("div")
    div.className = this.#galleryClassNames
    return { element: div }
  }

  get #galleryClassNames () {
    return "attachment-gallery attachment-gallery--" + this.getChildrenSize()
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
