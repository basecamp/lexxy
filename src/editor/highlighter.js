import { $getSelection, $isRangeSelection } from "lexical"
import { $forEachSelectedTextNode, $patchStyleText, getStyleObjectFromCSS } from "@lexical/selection"

export default class Highlighter {
  constructor(editorElement) {
    this.editor = editorElement.editor
  }

  apply(color = {}) {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection) || selection.isCollapsed()) return

      $patchStyleText(selection, color)
      $forEachSelectedTextNode(node => this.#syncHighlightWithStyle(node))
    })
  }

  remove() {
    this.apply({ "color": null, "background-color": null })
  }

  #syncHighlightWithStyle(node) {
    if (this.#hasHighlightStyles(node) !== node.hasFormat("highlight")) {
      node.toggleFormat("highlight")
    }
  }

  #hasHighlightStyles(node) {
    const style = getStyleObjectFromCSS(node.getStyle())
    return !!(style.color || style["background-color"])
  }
}
