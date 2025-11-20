import {
  $getSelection,
  $isRangeSelection,
} from "lexical"

import { $forEachSelectedTextNode, $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection"

export default class Highlighter {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
  }

  apply(color = {}) {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection) || selection.isCollapsed()) return

      $patchStyleText(selection, color)
      $forEachSelectedTextNode(node => this.#applyHighlightToTextNode(node))
    })
  }

  remove() {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      $patchStyleText(selection, { "color": null, "background-color": null })
      $forEachSelectedTextNode(node => this.#removeHighlightFromTextNode(node))
    })
  }

  #applyHighlightToTextNode(node) {
    const shouldHaveHighlight = !this.#hasNoColorStyles(node)
    const hasHighlight = node.hasFormat("highlight")

    if (shouldHaveHighlight !== hasHighlight) {
      node.toggleFormat("highlight")
    }
  }

  #removeHighlightFromTextNode(node) {
    if (node.hasFormat("highlight")) {
      node.toggleFormat("highlight")
    }
  }

  #hasNoColorStyles(node) {
    const textColor = $getSelectionStyleValueForProperty(node.select(), "color", "")
    const backgroundColor = $getSelectionStyleValueForProperty(node.select(), "background-color", "")

    return textColor === "" && backgroundColor === ""
  }
}

