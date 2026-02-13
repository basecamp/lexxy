import { $getSelection, $splitNode, ElementNode } from "lexical"
import { $descendantsMatching, $firstToLastIterator, $getNearestNodeOfType, $unwrapNode, $wrapNodeInElement } from "@lexical/utils"

import { $isActionTextAttachmentNode, ActionTextAttachmentNode } from "./action_text_attachment_node"
import { $makeSafeForRoot } from "../helpers/lexical_helper"

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
        const containsAttachment = element.querySelector(`:scope > :is(${this.#attachmentTags.join()})`)
        if (!containsAttachment) return null

        return {
          conversion: () => {
            return {
              node: $createImageGalleryNode(),
              after: children => $descendantsMatching(children, this.isValidChild)
            }
          },
          priority: 2
        }
      }
    }
  }

  static isValidChild(node) {
    return $isActionTextAttachmentNode(node) && node.isPreviewableAttachment
  }

  static get #attachmentTags() {
    return Object.keys(ActionTextAttachmentNode.importDOM())
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

  canBeEmpty() {
    return false
  }

  collapseAtStart(selection) {
    const shouldCollapse = true

    if (shouldCollapse) {

    }

    return false
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
      if (!this.constructor.isValidChild(child)) {
        const poppedNode = $makeSafeForRoot(child)
        const [ topGallery ] = this.splitAtIndex(poppedNode.getIndexWithinParent())
        topGallery.insertAfter(poppedNode)
        poppedNode.selectEnd()
        break
      }
    }
  }

  splitAtIndex(index) {
    return $splitNode(this, index)
  }

  get #galleryClassNames () {
    return "attachment-gallery"
  }

  #hasSelectionWithin(selection = $getSelection()) {
    return selection?.getNodes().some(node => node.is(this) || this.isParentOf(node))
  }
}

export function $createImageGalleryNode() {
  return new ImageGalleryNode()
}

export function $isImageGalleryNode(node) {
  return node instanceof ImageGalleryNode
}

export function $findOrCreateGalleryForImage(node) {
  const existingGallery = $getNearestNodeOfType(node, ImageGalleryNode)
  return existingGallery || $wrapNodeInElement(node, $createImageGalleryNode)
}
