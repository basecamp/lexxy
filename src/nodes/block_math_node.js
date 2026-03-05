import { DecoratorNode } from "lexical"
import { createElement } from "../helpers/html_helper"
import { renderMath } from "../helpers/math_helper"

export class BlockMathNode extends DecoratorNode {
  $config() {
    return this.config("block_math", {
      $importJSON: (serialized) => new BlockMathNode({ latex: serialized.latex }),
      importDOM: {
        div: (element) => {
          if (!element.classList.contains("math-block") || !element.hasAttribute("data-math")) return null

          return {
            conversion: (div) => ({ node: new BlockMathNode({ latex: div.getAttribute("data-math") }) }),
            priority: 2
          }
        }
      }
    })
  }

  constructor({ latex = "" } = {}, key) {
    super(key)
    this.__latex = latex
  }

  afterCloneFrom(prevNode) {
    super.afterCloneFrom(prevNode)
    this.__latex = prevNode.__latex
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

    return figure
  }

  updateDOM(prevNode, dom) {
    if (this.__latex === prevNode.__latex) return false

    const preview = dom.querySelector(".lexxy-math-block__preview")
    if (!preview) return true

    if (this.__latex) {
      preview.classList.remove("lexxy-math-block__preview--empty")
      preview.innerHTML = renderMath(this.__latex, { displayMode: true })
    } else {
      preview.textContent = "Click to add math formula"
      preview.classList.add("lexxy-math-block__preview--empty")
    }

    return false
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

  setLatex(latex) {
    const writable = this.getWritable()
    writable.__latex = latex
  }

  decorate() {
    return null
  }
}

export function $isBlockMathNode(node) {
  return node instanceof BlockMathNode
}
