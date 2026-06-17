import { LineBreakNode } from "lexical"

// Renders a soft return as a markable element in the editor DOM so a formatting
// mark can be painted on it via CSS. Browsers don't draw ::before/::after on a
// bare <br>, and a run of <br><br> offers no element to hang a marker on, so the
// <br> is wrapped in a span the stylesheet can target. exportDOM still emits a
// plain <br>, leaving serialized content untouched.
export class MarkableLineBreakNode extends LineBreakNode {
  $config() {
    return this.config("markable_line_break", { extends: LineBreakNode })
  }

  createDOM() {
    const element = document.createElement("span")
    element.className = "lexxy-line-break"
    // contenteditable="false" makes the wrapper atomic to the browser's native
    // Selection.modify, so deleting/extending across the break behaves exactly
    // like a bare <br>. Without it the caret can land inside the span and the
    // break resists deletion.
    element.contentEditable = "false"
    element.appendChild(document.createElement("br"))
    return element
  }

  exportDOM() {
    return { element: document.createElement("br") }
  }
}
