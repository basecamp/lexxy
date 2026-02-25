import { $createParagraphNode, $splitNode, ElementNode } from "lexical"
import { $descendantsMatching, $firstToLastIterator, $getNearestNodeOfType, $insertFirst, $unwrapAndFilterDescendants, $wrapNodeInElement } from "@lexical/utils"

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
      gallery.unwrapEmptyNode()
        || gallery.replaceWithSingularChild()
        || gallery.splitAroundInvalidChild()
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

  static canCollapseWith(node) {
    return $isImageGalleryNode(node) || this.isValidChild(node)
  }

  static isValidChild(node) {
    return $isActionTextAttachmentNode(node) && node.isPreviewableImage
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
    dom.className = this.#galleryClassNames
    return false
  }

  canBeEmpty() {
    // Return `true` to conform to `$isBlock(node)`
    // We clean-up empty galleries with a transform
    return true
  }

  collapseAtStart(_selection) {
    return true
  }

  insertNewAfter(selection, restoreSelection) {
    const selectionAtLastChild = selection.anchor.offset == this.getChildrenSize() - 1
    if (selectionAtLastChild) {
      const paragraph = $createParagraphNode()
      this.insertAfter(paragraph, false)
      paragraph.insertAfter(this.getLastChild(), false)
      paragraph.selectEnd()

      // return null as selection has been managed
      return null
    }

    const newNode = $createImageGalleryNode()
    this.insertAfter(newNode, restoreSelection)
    return newNode
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

  collapseWith(node, backwards) {
    if (!ImageGalleryNode.canCollapseWith(node)) return false

    if (backwards) {
      $insertFirst(this, node)
    } else {
      this.append(node)
    }

    $unwrapAndFilterDescendants(this, ImageGalleryNode.isValidChild)

    return true
  }

  unwrapEmptyNode() {
    if (this.isEmpty()) {
      const paragraph = $createParagraphNode()
      return this.replace(paragraph)
    }
  }

  replaceWithSingularChild() {
    if (this.#hasSingularChild) {
      const child = this.getFirstChild()
      return this.replace(child)
    }
  }

  splitAroundInvalidChild() {
    for (const child of $firstToLastIterator(this)) {
      if (ImageGalleryNode.isValidChild(child)) continue

      const poppedNode = $makeSafeForRoot(child)
      const [ topGallery, secondGallery ] = this.splitAtIndex(poppedNode.getIndexWithinParent())
      topGallery.insertAfter(poppedNode)
      poppedNode.selectEnd()

      // remove an empty gallery rather than let it unwrap to a paragraph
      if (secondGallery.isEmpty()) secondGallery.remove()

      break
    }
  }

  splitAtIndex(index) {
    return $splitNode(this, index)
  }

  get #hasSingularChild() {
    return this.getChildrenSize() === 1
  }

  get #galleryClassNames() {
    return `attachment-gallery attachment-gallery--${this.getChildrenSize()}`
  }
}

export function $createImageGalleryNode() {
  return new ImageGalleryNode()
}

export function $isImageGalleryNode(node) {
  return node instanceof ImageGalleryNode
}

export function $findOrCreateGalleryForImage(node) {
  if (!ImageGalleryNode.canCollapseWith(node)) return null

  const existingGallery = $getNearestNodeOfType(node, ImageGalleryNode)
  return existingGallery ?? $wrapNodeInElement(node, $createImageGalleryNode)
}
