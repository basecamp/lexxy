import { DecoratorNode } from "lexical"
import { createElement } from "../helpers/html_helper"
import { renderMath } from "../helpers/math_helper"

export class InlineMathNode extends DecoratorNode {
  $config() {
    return this.config("inline_math", {
      $importJSON: (serialized) => new InlineMathNode({ latex: serialized.latex }),
      importDOM: {
        span: (element) => {
          if (!element.classList.contains("math-inline") || !element.hasAttribute("data-math")) return null

          return {
            conversion: (span) => ({ node: new InlineMathNode({ latex: span.getAttribute("data-math") }) }),
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
    const span = createElement("span", {
      className: "lexxy-math-inline",
      "data-lexxy-decorator": true
    })

    if (this.__latex) {
      span.innerHTML = renderMath(this.__latex)
    } else {
      span.textContent = "$\\ldots$"
    }

    return span
  }

  updateDOM(prevNode, dom) {
    if (this.__latex === prevNode.__latex) return false

    if (this.__latex) {
      dom.innerHTML = renderMath(this.__latex)
    } else {
      dom.textContent = "$\\ldots$"
    }

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

  setLatex(latex) {
    const writable = this.getWritable()
    writable.__latex = latex
  }

  decorate() {
    return null
  }
}

export function $isInlineMathNode(node) {
  return node instanceof InlineMathNode
}
