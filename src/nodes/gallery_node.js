import { ElementNode } from "lexical"
import { createElement } from "../helpers/html_helper"
import { GalleryImageNode } from "./gallery_image_node"

const COLUMNS = 3

export class GalleryNode extends ElementNode {
  static getType() {
    return "gallery"
  }

  static clone(node) {
    return new GalleryNode(node.__key)
  }

  static importJSON(serializedNode) {
    return new GalleryNode()
  }

  static importDOM() {
    return null
  }

  constructor(key) {
    super(key)
  }

  static get COLUMNS() {
    return COLUMNS
  }

  createDOM() {
    const div = createElement("div", { className: `gallery gallery--columns-${COLUMNS}` })
    return div
  }

  updateDOM() {
    return false
  }

  isInline() {
    return false
  }

  canBeEmpty() {
    return false
  }

  canInsertTextBefore() {
    return false
  }

  canInsertTextAfter() {
    return false
  }

  canIndent() {
    return false
  }

  collapseAtStart() {
    return true
  }

  exportDOM() {
    const div = createElement("div", { className: `gallery gallery--columns-${COLUMNS}` })

    for (const child of this.getChildren()) {
      if (child instanceof GalleryImageNode) {
        const { element } = child.exportDOM()
        if (element) div.appendChild(element)
      }
    }

    return { element: div }
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "gallery",
      version: 1
    }
  }
}
