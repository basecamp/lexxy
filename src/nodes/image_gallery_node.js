import { $createParagraphNode, $getSelection, $splitNode, ElementNode } from "lexical"
import { $descendantsMatching, $firstToLastIterator, $getNearestNodeOfType, $unwrapNode, $wrapNodeInElement } from "@lexical/utils"

import { $isActionTextAttachmentNode, ActionTextAttachmentNode } from "./action_text_attachment_node"

export class ImageGalleryNode extends ElementNode {
  $config() {
    return this.config("image_gallery", {
      extends: ElementNode,
    })
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

  static transform() {
    return (gallery) => {
      gallery.unwrapEmptyOrSingleChildNode()
      gallery.splitAroundInvalidChild()
    }
  }

  createDOM() {
    const div = document.createElement("div")
    div.className = this.#galleryClassNames
    return div
  }

  updateDOM(_prevNode, dom) {
    dom.classList = this.#galleryClassNames
    return false
  }

  select(anchorOffset, focusOffset) {
    console.debug("select", anchorOffset, focusOffset)
    if (anchorOffset === undefined) {
      return this.selectNext(0, 0)
    } else if (anchorOffset === 0) {
      return this.selectPrevious()
    } else {
      // adjust so we can select forwards/backwards
      const targetChild = this.getChildAtIndex(anchorOffset)
      const selectionTarget = targetChild.isSelected($getSelection()) ? targetChild.getPreviousSibling() : targetChild
      return selectionTarget.select()
    }
  }

  canInsertTextBefore() {
    return false
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

  unwrapEmptyOrSingleChildNode() {
    if (this.getChildrenSize() <= 1) {
      $unwrapNode(this)
    }
  }

  splitAroundInvalidChild() {
    for (const child of $firstToLastIterator(this)) {
      if (!this.validChild(child)) {
        const poppedNode = child.isParentRequired() ? $wrapNodeInElement(child, $createParagraphNode) : child
        const [ topGallery ] = $splitNode(this, poppedNode.getIndexWithinParent())
        topGallery.insertAfter(poppedNode)
        poppedNode.selectEnd()
        break
      }
    }
  }

  validChild(node) {
    return $isActionTextAttachmentNode(node) && node.isPreviewableAttachment
  }

  get #galleryClassNames () {
    return "attachment-gallery"
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
