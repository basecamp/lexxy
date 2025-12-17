import { DecoratorNode } from "lexical"
import { createElement, dispatchCustomEvent } from "../helpers/html_helper"

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

  createDOM() {
    const figure = createElement("figure", { className: "horizontal-divider" })
    const hr = createElement("hr")

    figure.addEventListener("click", (event) => {
      dispatchCustomEvent(figure, "lexxy:internal:select-node", { key: this.getKey() })
    })

    figure.appendChild(hr)

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
