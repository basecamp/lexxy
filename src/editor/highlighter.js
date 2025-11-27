import { $getSelection, $isRangeSelection, TextNode } from "lexical"
import { $getSelectionStyleValueForProperty, $patchStyleText, getStyleObjectFromCSS } from "@lexical/selection"

export default class Highlighter {
  constructor(editorElement) {
    this.editor = editorElement.editor

    this.#registerHighlightTransform()
  }

  toggle(styles) {
    this.editor.update(() => {
      this.#toggleSelectionStyles(styles)
    })
  }

  remove() {
    this.toggle({ "color": undefined, "background-color": undefined })
  }

  #registerHighlightTransform() {
    return this.editor.registerNodeTransform(TextNode, (textNode) => {
      this.#syncHighlightWithStyle(textNode)
    })
  }

  #toggleSelectionStyles(styles) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const patch = {}
    for (const property in styles) {
      const oldValue = $getSelectionStyleValueForProperty(selection, property)
      patch[property] = this.#toggleOrReplace(oldValue, styles[property])
    }

    $patchStyleText(selection, patch)
  }

  #toggleOrReplace(oldValue, newValue) {
    return oldValue === newValue ? null : newValue
  }

  #syncHighlightWithStyle(node) {
    if (this.#hasHighlightStyles(node) !== node.hasFormat("highlight")) {
      node.toggleFormat("highlight")
    }
  }

  #hasHighlightStyles(node) {
    const styles = getStyleObjectFromCSS(node.getStyle())
    return !!(styles.color || styles["background-color"])
  }
}
