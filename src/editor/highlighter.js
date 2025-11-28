import { $getSelection, $isRangeSelection, TextNode } from "lexical"
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection"
import { hasHighlightStyles } from "../helpers/format_helper"

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
    this.toggle({ "color": null, "background-color": null })
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
    if (hasHighlightStyles(node.getStyle()) !== node.hasFormat("highlight")) {
      node.toggleFormat("highlight")
    }
  }
}
