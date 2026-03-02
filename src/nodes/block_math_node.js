import { DecoratorNode } from "lexical"
import { createElement } from "../helpers/html_helper"
import { renderMath } from "../helpers/math_helper"

export class BlockMathNode extends DecoratorNode {
  static getType() {
    return "block_math"
  }

  static clone(node) {
    return new BlockMathNode({ latex: node.__latex }, node.__key)
  }

  static importJSON(serializedNode) {
    return new BlockMathNode({ latex: serializedNode.latex })
  }

  static importDOM() {
    return {
      div: (element) => {
        if (!element.classList.contains("math-block") || !element.hasAttribute("data-math")) {
          return null
        }

        return {
          conversion: (div) => ({
            node: new BlockMathNode({ latex: div.getAttribute("data-math") })
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
    const figure = createElement("figure", { className: "lexxy-math-block" })

    const preview = createElement("div", { className: "lexxy-math-block__preview" })
    if (this.__latex) {
      preview.innerHTML = renderMath(this.__latex, { displayMode: true })
    } else {
      preview.textContent = "Click to add math formula"
      preview.classList.add("lexxy-math-block__preview--empty")
    }
    figure.appendChild(preview)

    const deleteButton = createElement("lexxy-node-delete-button")
    figure.appendChild(deleteButton)

    preview.addEventListener("click", (event) => {
      event.stopPropagation()
      figure.dispatchEvent(new CustomEvent("lexxy:edit-math", {
        bubbles: true,
        detail: { nodeKey: this.getKey(), latex: this.__latex, displayMode: true }
      }))
    })

    return figure
  }

  updateDOM() {
    return true
  }

  getTextContent() {
    return `$$${this.__latex}$$\n\n`
  }

  isInline() {
    return false
  }

  exportDOM() {
    const div = createElement("div", {
      className: "math-block",
      "data-math": this.__latex
    })
    div.textContent = `$$${this.__latex}$$`
    return { element: div }
  }

  exportJSON() {
    return {
      type: "block_math",
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
