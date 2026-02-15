import { DecoratorNode } from "lexical"
import { createElement, dispatchCustomEvent } from "../helpers/html_helper"

export class GalleryImageNode extends DecoratorNode {
  static getType() {
    return "gallery_image"
  }

  static clone(node) {
    return new GalleryImageNode({ src: node.__src, altText: node.__altText }, node.__key)
  }

  static importJSON(serializedNode) {
    return new GalleryImageNode({ src: serializedNode.src, altText: serializedNode.altText })
  }

  constructor({ src, altText }, key) {
    super(key)
    this.__src = src || ""
    this.__altText = altText || ""
  }

  createDOM() {
    const figure = createElement("figure", { className: "gallery__image" })
    const img = createElement("img", { src: this.__src, alt: this.__altText })
    figure.appendChild(img)

    figure.addEventListener("click", () => {
      dispatchCustomEvent(figure, "lexxy:internal:select-node", { key: this.getKey() })
    })

    return figure
  }

  updateDOM() {
    return false
  }

  getTextContent() {
    return ""
  }

  isInline() {
    return false
  }

  exportDOM() {
    const img = createElement("img", { src: this.__src, alt: this.__altText })
    return { element: img }
  }

  exportJSON() {
    return {
      type: "gallery_image",
      version: 1,
      src: this.__src,
      altText: this.__altText
    }
  }

  decorate() {
    return null
  }
}
