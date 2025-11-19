import { TextNode } from "lexical"
import { extendTextNodeConversion } from "../helpers/lexical_helper"
import { applyHighlightStyle } from "./highlight_node"

export class TrixTextNode extends TextNode {
  $config() {
    return this.config("trix-text", { extends: TextNode })
  }

  static importDOM() {
    return {
      em: (element) => onlyStyledElements(element, {
        conversion: extendTextNodeConversion("i", applyHighlightStyle),
        priority: 1
      }),
      span: (element) => onlyStyledElements(element, {
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      }),
      strong: (element) => onlyStyledElements(element, {
        conversion: extendTextNodeConversion("b", applyHighlightStyle),
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

function applyStrikethrough(textNode, element) {
  if (!textNode.hasFormat("strikethrough")) textNode.toggleFormat("strikethrough")
  return applyHighlightStyle(textNode, element)
}
