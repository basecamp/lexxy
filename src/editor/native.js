import { $getSelection, $isRangeSelection } from "lexical"
import { $isLinkNode } from "@lexical/link"
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { $isCodeNode } from "@lexical/code"

import { getListType } from "../helpers/lexical_helper"
import { isSelectionHighlighted, getHighlightStyles } from "../helpers/format_helper"
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
      const value = getComputedStyle(resolver).getPropertyValue(property)
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

      const anchorNode = selection.anchor.getNode()
      if (!anchorNode.getParent()) return

      // Get link info
      let inLink = false
      let linkHref = null
      let node = anchorNode
      while (node) {
        if ($isLinkNode(node)) {
          inLink = true
          linkHref = node.getURL()
          break
        }
        node = node.getParent()
      }

      // Get block-level info
      const topLevelElement = anchorNode.getTopLevelElementOrThrow()
      const inQuote = $isQuoteNode(topLevelElement)
      const inHeading = $isHeadingNode(topLevelElement)

      // Get list type
      const listType = getListType(anchorNode)

      // Only include truthy attributes - false/undefined values mean "enabled but not active"
      // iOS interprets false as "disabled", so we must omit inactive attributes
      attributes = {}
      if (selection.hasFormat("bold")) attributes.bold = true
      if (selection.hasFormat("italic")) attributes.italic = true
      if (selection.hasFormat("strikethrough")) attributes.strikethrough = true
      const inCode = $isCodeNode(topLevelElement) || selection.hasFormat("code")
      if (inCode) attributes.code = true
      if (isSelectionHighlighted(selection)) {
        attributes.highlight = true
        highlight = getHighlightStyles(selection)
      }
      if (inLink) attributes.link = true
      if (inQuote) attributes.quote = true
      if (inHeading) attributes.heading = true
      if (listType === "bullet") attributes["unordered-list"] = true
      if (listType === "number") attributes["ordered-list"] = true
      link = inLink && linkHref ? { href: linkHref } : null
    })

    if (attributes) {
      dispatch(this.editorElement, "lexxy:attributes-change", { attributes, link, highlight })
    }
  }
}
