import { $getSelection, $isRangeSelection } from "lexical"
import { $getNearestNodeOfType } from "@lexical/utils"
import { LinkNode } from "@lexical/link"

import { getHighlightStyles } from "../helpers/format_helper"
import { dispatch } from "../helpers/html_helper"

export default class Native {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
  }

  dispatchHighlightColors() {
    const buttons = this.editorElement.config.get("highlight.buttons")
    if (!buttons) return

    dispatch(this.editorElement, "lexxy:highlight-colors", {
      colors: this.#resolveColors("color", buttons.color || []),
      backgroundColors: this.#resolveColors("background-color", buttons["background-color"] || [])
    })
  }

  #resolveColors(property, cssValues) {
    const resolver = document.createElement("span")
    resolver.style.display = "none"
    this.editorElement.appendChild(resolver)

    const resolved = cssValues.map(cssValue => {
      resolver.style.setProperty(property, cssValue)
      const value = window.getComputedStyle(resolver).getPropertyValue(property)
      resolver.style.removeProperty(property)
      return { name: cssValue, value }
    })

    resolver.remove()
    return resolved
  }

  dispatchAttributesChange() {
    let attributes = null
    let link = null
    let highlight = null

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const format = this.#selection.getFormat()
      if (Object.keys(format).length === 0) return

      const anchorNode = selection.anchor.getNode()
      const linkNode = $getNearestNodeOfType(anchorNode, LinkNode)

      attributes = {
        bold: { active: format.isBold, enabled: true },
        italic: { active: format.isItalic, enabled: true },
        strikethrough: { active: format.isStrikethrough, enabled: true },
        code: { active: format.isInCode, enabled: true },
        highlight: { active: format.isHighlight, enabled: true },
        link: { active: format.isInLink, enabled: true },
        quote: { active: format.isInQuote, enabled: true },
        heading: { active: format.isInHeading, enabled: true },
        "unordered-list": { active: format.isInList && format.listType === "bullet", enabled: true },
        "ordered-list": { active: format.isInList && format.listType === "number", enabled: true },
        undo: { active: false, enabled: this.#historyState?.undoStack.length > 0 },
        redo: { active: false, enabled: this.#historyState?.redoStack.length > 0 }
      }

      link = linkNode ? { href: linkNode.getURL() } : null
      highlight = format.isHighlight ? getHighlightStyles(selection) : null
    })

    if (attributes) {
      dispatch(this.editorElement, "lexxy:attributes-change", { attributes, link, highlight })
    }
  }

  get #selection() {
    return this.editorElement.selection
  }

  get #historyState() {
    return this.editorElement.historyState
  }
}
