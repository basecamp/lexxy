import lexxyConfig from "../config/lexxy"
import { $hasUpdateTag, PASTE_TAG, TextNode } from "lexical"
import { extendTextNodeConversion } from "../helpers/lexical_helper"
import { StyleCanonicalizer } from "../helpers/format_helper"

export class HighlightNode extends TextNode {
  $config() {
    return this.config("highlight", { extends: TextNode })
  }

  static importDOM() {
    return {
      mark: () => ({
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      })
    }
  }
}

export function applyHighlightStyle(textNode, element) {
  const elementStyles = {
    color: element.style?.color,
    "background-color": element.style?.backgroundColor
  }

  const canonicalizeOnPaste = { canonicalize: $hasUpdateTag(PASTE_TAG) }
  const highlightStyle = buildHighlightStyle(elementStyles, canonicalizeOnPaste)

  if (highlightStyle.length) {
    if (!textNode.hasFormat("highlight")) textNode.toggleFormat("highlight")
    return textNode.setStyle(textNode.getStyle() + highlightStyle)
  }
}

function buildHighlightStyle(elementStyles, { canonicalize } = {}) {
  let highlightStyle = ""

  for (const property in elementStyles) {
    let value = elementStyles[property]

    if (elementStyles[property]) {
    if (canonicalize) value = getCanonicalPropertyValue(property, value)
      if (value) highlightStyle += `${property}: ${value};`
    }
  }

  return highlightStyle
}

function getCanonicalPropertyValue(property, value) {
  return CANONICALIZERS[property].getCanonicalAllowedValue(value) ?? ""
}

const allowedColorValues = [
  ...lexxyConfig.global.get("highlight.color.buttons"),
  ...lexxyConfig.global.get("highlight.color.permit")
]

const allowedBackgroundColorValue = [
  ...lexxyConfig.global.get("highlight.background-color.buttons"),
  ...lexxyConfig.global.get("highlight.background-color.permit")
]

const CANONICALIZERS = {
  color: new StyleCanonicalizer("color", allowedColorValues),
  "background-color": new StyleCanonicalizer( "background-color", allowedBackgroundColorValue)
}
