import { $createParagraphNode, defineExtension } from "lexical"
import { CodeNode } from "@lexical/code"
import { extendConversion, extendTextNodeConversion } from "../helpers/lexical_helper"
import { importedCodeLanguage } from "../helpers/code_language_helper"
import { $applyHighlightStyle } from "./highlight_extension"
import LexxyExtension from "./lexxy_extension"

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
          }),
          div: (element) => onlyBlankLineDivs(element, {
            conversion: () => ({ node: $createParagraphNode() }),
            priority: 1
          })
        }
      }
    })
  }
}

// Trix writes a blank line as <div><br></div>. Lexical has no importer for <div>,
// and it drops a <br> that is a block's only child, so the blank line would
// vanish and the paragraphs around it would run together. An empty paragraph is
// how Lexxy writes a blank line, so load each one as that. List items and quotes
// are left alone: a paragraph can't sit inside them.
function onlyBlankLineDivs(element, conversion) {
  const children = Array.from(element.childNodes).filter((node) => !isIgnorableNode(node))
  const isBlankLine = children.length === 1 && children[0].nodeName === "BR"
  return isBlankLine && !element.closest("li, blockquote") ? conversion : null
}

function isIgnorableNode(node) {
  return node.nodeType === Node.COMMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "")
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
  return !element.hasAttribute("data-language") && importedCodeLanguage(element) ? conversion : null
}

function $applyLanguage(conversionOutput, element) {
  conversionOutput.node.setLanguage(importedCodeLanguage(element))
}
