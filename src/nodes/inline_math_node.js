import { DecoratorNode } from "lexical"
import { createElement } from "../helpers/html_helper"
import { renderMath } from "../helpers/math_helper"

export class InlineMathNode extends DecoratorNode {
  static getType() {
    return "inline_math"
  }

  static clone(node) {
    return new InlineMathNode({ latex: node.__latex }, node.__key)
  }

  static importJSON(serializedNode) {
    return new InlineMathNode({ latex: serializedNode.latex })
  }

  static importDOM() {
    return {
      span: (element) => {
        if (!element.classList.contains("math-inline") || !element.hasAttribute("data-math")) {
          return null
        }

        return {
          conversion: (span) => ({
            node: new InlineMathNode({ latex: span.getAttribute("data-math") })
          }),
          priority: 2
        }
      }
    }
  }

  constructor({ latex = "" } = {}, key) {
    super(key)
    this.__latex = latex
  }

  createDOM() {
    const span = createElement("span", {
      className: "lexxy-math-inline",
      "data-lexxy-decorator": true
    })

    if (this.__latex) {
      span.innerHTML = renderMath(this.__latex)
    } else {
      span.textContent = "$\\ldots$"
    }

    span.addEventListener("click", (event) => {
      event.stopPropagation()
      span.dispatchEvent(new CustomEvent("lexxy:edit-math", {
        bubbles: true,
        detail: { nodeKey: this.getKey(), latex: this.__latex, displayMode: false }
      }))
    })

    return span
  }

  updateDOM() {
    return false
  }

  getTextContent() {
    return `$${this.__latex}$`
  }

  isInline() {
    return true
  }

  exportDOM() {
    const span = createElement("span", {
      className: "math-inline",
      "data-math": this.__latex
    })
    span.textContent = `$${this.__latex}$`
    return { element: span }
  }

  exportJSON() {
    return {
      type: "inline_math",
      version: 1,
      latex: this.__latex
    }
  }

  getLatex() {
    return this.__latex
  }

  decorate() {
    return null
  }
}
