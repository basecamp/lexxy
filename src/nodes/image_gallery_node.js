import { $createParagraphNode, $getSelection, $splitNode, ElementNode } from "lexical"
import { $descendantsMatching, $firstToLastIterator, $getNearestNodeOfType, $unwrapNode, $wrapNodeInElement } from "@lexical/utils"

import { $isActionTextAttachmentNode, ActionTextAttachmentNode } from "./action_text_attachment_node"

export class ImageGalleryNode extends ElementNode {
  $config() {
    return this.config("image_gallery", {
      extends: ElementNode,
    })
  }

  static transform() {
    return (gallery) => {
      gallery.unwrapEmptyOrSingleChildNode()
      gallery.splitAroundInvalidChild()
    }
  }

  static importDOM() {
    return {
      div: (element) => {
        const containsAttachment = element.querySelector(":scope > :is(img, video, " + ActionTextAttachmentNode.TAG_NAME + ")")
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
    const div = document.createElement("div")
    div.className = this.#galleryClassNames
    return div
  }

  updateDOM(_prevNode, dom) {
    dom.classList = this.#galleryClassNames
    return false
  }

  select(anchorOffset, _focusOffset) {
    if (anchorOffset === undefined) {
      return this.selectNext(0, 0)
    } else if (anchorOffset === 0) {
      return this.selectPrevious()
    } else {
      // adjust so we can select forwards/backwards
      const targetChild = this.getChildAtIndex(anchorOffset) ?? this.getLastChild()
      const selectionTarget = targetChild.isSelected($getSelection()) ? targetChild.getPreviousSibling() : targetChild
      return selectionTarget.select()
    }
  }

  canInsertTextBefore() {
    return false
  }

  canInsertTextAfter() {
    return false
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
      const wasSelected = this.#hasSelectionWithin()
      const child = this.getFirstChild()
      $unwrapNode(this)
      if (wasSelected && child) child.select()
    }
  }

  splitAroundInvalidChild() {
    for (const child of $firstToLastIterator(this)) {
      if (!this.isValidChild(child)) {
        const poppedNode = child.isParentRequired() ? $wrapNodeInElement(child, $createParagraphNode) : child
        const [ topGallery ] = $splitNode(this, poppedNode.getIndexWithinParent())
        topGallery.insertAfter(poppedNode)
        poppedNode.selectEnd()
        break
      }
    }
  }

  isValidChild(node) {
    return $isActionTextAttachmentNode(node) && node.isPreviewableAttachment
  }

  get #galleryClassNames () {
    return "attachment-gallery"
  }

  #hasSelectionWithin(selection = null) {
    const targetSelection = selection || $getSelection()
    return targetSelection?.getNodes().some(node => node.is(this) || this.isParentOf(node))
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
