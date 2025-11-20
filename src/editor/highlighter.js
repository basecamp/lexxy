import { $getSelection } from "lexical"
import { $forEachSelectedTextNode, $getSelectionStyleValueForProperty, $patchStyleText, getStyleObjectFromCSS } from "@lexical/selection"

export default class Highlighter {
  constructor(editorElement) {
    this.editor = editorElement.editor
  }

  toggle(styles) {
    this.editor.update(() => {
      this.#toggleSelectionStyles(styles)
      $forEachSelectedTextNode(node => this.#syncHighlightWithStyle(node))
    })
  }

  remove() {
    this.toggle({ "color": undefined, "background-color": undefined })
  }

  #toggleSelectionStyles(styles) {
    const selection = $getSelection()

    for (const property in styles) {
      const oldValue = $getSelectionStyleValueForProperty(selection, property)
      const patch = { [property]: this.#toggleOrReplace(oldValue, styles[property]) }
      $patchStyleText(selection, patch)
    }
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
