import { TextNode } from "lexical"
import { extendTextNodeConversion } from "../helpers/lexical_helper"

export class HighlightNode extends TextNode {
  $config() {
    return this.config("highlight", { extends: TextNode })
  }

  static importDOM() {
    return {
      mark: () => ({
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      }),
      span: (element) => onlyStyledElements(element, {
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      }),
      del: () => ({
        conversion: extendTextNodeConversion("s", applyStrikethrough),
        priority: 1
      })
    }
  }
}

function onlyStyledElements(element, conversion) {
  const elementHighlighted = element.style.color !== "" || element.style.backgroundColor !== ""
  return elementHighlighted ? conversion : null
}

function applyHighlightStyle(textNode, element) {
  const textColor = element.style?.color
  const backgroundColor = element.style?.backgroundColor

  let highlightStyle = ""
  if (textColor && textColor !== "") highlightStyle += `color: ${textColor};`
  if (backgroundColor && backgroundColor !== "") highlightStyle += `background-color: ${backgroundColor};`

  if (highlightStyle.length) {
    if (!textNode.hasFormat("highlight")) textNode.toggleFormat("highlight")
    return textNode.setStyle(textNode.getStyle() + highlightStyle)
  }
}
