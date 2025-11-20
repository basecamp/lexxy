import { TextNode } from "lexical"
import { CodeNode, normalizeCodeLang } from "@lexical/code"
import { extendConversion, extendTextNodeConversion } from "../helpers/lexical_helper"
import { applyHighlightStyle } from "./highlight_node"

const TRIX_LANGUAGE_ATTR = "language"

export class TrixTextNode extends TextNode {
  $config() {
    return this.config("trix-text", { extends: TextNode })
  }

  static importDOM() {
    return {
      // em, span, and strong elements are directly styled in trix
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
      // del => s
      del: () => ({
        conversion: extendTextNodeConversion("s", applyStrikethrough),
        priority: 1
      }),
      // read "language" attribute and normalize
      pre: (element) => onlyPreLanguageElements(element, {
        conversion: extendConversion(CodeNode, "pre", applyLanguage),
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

function onlyPreLanguageElements(element, conversion) {
  return element.hasAttribute(TRIX_LANGUAGE_ATTR) ? conversion: null
}

function applyLanguage(conversionOutput, element) {
  const language = normalizeCodeLang(element.getAttribute(TRIX_LANGUAGE_ATTR))
  conversionOutput.node.setLanguage(language)
}
