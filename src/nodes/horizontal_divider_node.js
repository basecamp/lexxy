import { DecoratorNode } from "lexical"
import { createElement } from "../helpers/html_helper"

export class HorizontalDividerNode extends DecoratorNode {
  static getType() {
    return "horizontal_divider"
  }

  static clone(node) {
    return new HorizontalDividerNode(node.__key)
  }

  static importJSON(serializedNode) {
    return new HorizontalDividerNode()
  }

  static importDOM() {
    return {
      "hr": (hr) => {
        return {
          conversion: () => ({
            node: new HorizontalDividerNode()
          }),
          priority: 1
        }
      }
    }
  }

  constructor(key) {
    super(key)
  }

  // The figure wraps the <hr> only for layout; assistive tech reads the
  // separator role on the <hr> itself and doesn't need a figure boundary
  // around it.
  createDOM() {
    const figure = createElement("figure", { className: "horizontal-divider", role: "presentation" })
    figure.appendChild(createElement("hr"))
    figure.dataset.lexicalNodeKey = this.__key

    return figure
  }

  updateDOM() {
    return true
  }

  getTextContent() {
    return "┄\n\n"
  }

  isInline() {
    return false
  }

  get label() {
    return "Horizontal divider"
  }

  exportDOM() {
    const hr = createElement("hr")
    return { element: hr }
  }

  exportJSON() {
    return {
      type: "horizontal_divider",
      version: 1
    }
  }

  decorate() {
    return null
  }
}
