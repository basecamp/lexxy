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

const trixForegroundColors = "#887626 #B95E06 #CF0000 #D81CAA #9013FE #0562B9 #118A0F #945216 #666666".split(" ")
const trixBackgroundColors = "#FAF785 #FFF0DB #FFE5E5 #FFE4F7 #F2EDFF #E1EFFC #E4F8E2 #EEE2D7 #F2F2F2".split(" ")

const ALLOWED_PROPERTY_VALUES = {
  color: [
    ...range(1, 9).map(n => `var(--highlight-${n})`),
    ...trixForegroundColors
  ],
  "background-color": [
    ...range(1, 9).map(n => `var(--highlight-bg-${n})`),
    ...trixBackgroundColors
  ]
}

const CANONICALIZERS = {
  color: new StyleCanonicalizer("color", ALLOWED_PROPERTY_VALUES.color),
  "background-color": new StyleCanonicalizer( "background-color", ALLOWED_PROPERTY_VALUES["background-color"])
}

function range(from, to) {
  return [ ...Array(1 + to - from).keys() ].map(i => i + from)
}
