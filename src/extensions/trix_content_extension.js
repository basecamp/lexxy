import { defineExtension } from "lexical"
import { CodeNode } from "@lexical/code"
import { isCodeLanguageLoaded, normalizeCodeLanguage } from "@lexical/code-prism"
import { extendConversion, extendTextNodeConversion } from "../helpers/lexical_helper"
import { $applyHighlightStyle } from "./highlight_extension"
import LexxyExtension from "./lexxy_extension"

const TRIX_LANGUAGE_ATTR = "language"

export class TrixContentExtension extends LexxyExtension {

  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/trix-content",
      html: {
        import: {
          em: (element) => onlyStyledElements(element, {
            conversion: extendTextNodeConversion("i", $applyHighlightStyle),
            priority: 1
          }),
          span: (element) => onlyStyledElements(element, {
            conversion: extendTextNodeConversion("span", $applyHighlightStyle),
            priority: 1
          }),
          strong: (element) => onlyStyledElements(element, {
            conversion: extendTextNodeConversion("b", $applyHighlightStyle),
            priority: 1
          }),
          del: () => ({
            conversion: extendTextNodeConversion("s", $applyStrikethrough, $applyHighlightStyle),
            priority: 1
          }),
          pre: (element) => onlyPreLanguageElements(element, {
            conversion: extendConversion(CodeNode, "pre", $applyLanguage),
            priority: 1
          })
        }
      }
    })
  }
}

function onlyStyledElements(element, conversion) {
  const elementHighlighted = element.style.color !== "" || element.style.backgroundColor !== ""
  return elementHighlighted ? conversion : null
}

function $applyStrikethrough(textNode) {
  if (!textNode.hasFormat("strikethrough")) textNode.toggleFormat("strikethrough")
  return textNode
}

function onlyPreLanguageElements(element, conversion) {
  return importedCodeLanguage(element) ? conversion : null
}

function $applyLanguage(conversionOutput, element) {
  conversionOutput.node.setLanguage(importedCodeLanguage(element))
}

// Lexical reads a code block's language from data-language alone. Trix writes it
// as `language` on <pre>, and markdown renderers as `lang` on <pre> or as a
// `language-*` class on its <code>.
function importedCodeLanguage(element) {
  if (element.hasAttribute("data-language")) {
    return null
  } else if (element.hasAttribute(TRIX_LANGUAGE_ATTR)) {
    return normalizeCodeLanguage(element.getAttribute(TRIX_LANGUAGE_ATTR))
  } else {
    return markdownCodeLanguage(element)
  }
}

function markdownCodeLanguage(element) {
  const language = normalizeCodeLanguage(element.getAttribute("lang") || codeLanguageClass(element) || "")

  if (isCodeLanguageLoaded(language)) {
    return language
  } else {
    return null
  }
}

function codeLanguageClass(element) {
  const code = element.querySelector(":scope > code")
  const languageClass = Array.from(code?.classList ?? []).find(name => name.startsWith("language-"))
  return languageClass?.replace("language-", "")
}
