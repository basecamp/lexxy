import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection
} from "lexical"

import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection"

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

      this.#formatTextNodes(selection, (node) => this.#applyHighlightToTextNode(node))
    })
  }

  remove() {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      $patchStyleText(selection, { "color": null, "background-color": null })

      this.#formatTextNodes(selection, (node) => this.#removeHighlightFromTextNode(node))
    })
  }

  #formatTextNodes(selection, fn) {
    const originalSelection = selection.clone()

    const textNodes = this.#getTextNodes(selection)
    textNodes.forEach((node) => {
      fn(node)
    })

    $setSelection(originalSelection)
  }

  #getTextNodes(selection) {
    return selection.getNodes().filter((node) => $isTextNode(node))
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

