import { LineBreakNode } from "lexical"

// Wraps a soft return's <br> in a markable span so CSS can paint a formatting
// mark on it: browsers don't draw ::before/::after on a bare <br>, and a run of
// <br><br> offers no element to hang a marker on. exportDOM still emits a plain
// <br>, so serialized content is unchanged.
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
