import { $createParagraphNode, defineExtension } from "lexical"
import { CodeNode, normalizeCodeLang } from "@lexical/code"
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
            conversion: extendTextNodeConversion("mark", $applyHighlightStyle),
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
          div: (element) => onlyEmptyBlocks(element, {
            conversion: () => ({ node: $createParagraphNode() }),
            priority: 1
          })
        }
      }
    })
  }
}

// Trix represents blank lines as empty block elements like <div><br></div> or <div></div>.
// Lexical drops a <br> that is the only child of a block and then discards the now-empty block,
// collapsing the blank line. We convert those empty blocks into empty paragraphs so the spacing
// survives the edit. Blocks with text or non-<br> elements fall through to Lexical's default
// handling so content and attachments are imported normally.
function onlyEmptyBlocks(element, conversion) {
  const hasText = element.textContent.trim() !== ""
  const hasNonLineBreakElement = Array.from(element.children).some((child) => child.nodeName !== "BR")
  return hasText || hasNonLineBreakElement ? null : conversion
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
  return element.hasAttribute(TRIX_LANGUAGE_ATTR) ? conversion : null
}

function $applyLanguage(conversionOutput, element) {
  const language = normalizeCodeLang(element.getAttribute(TRIX_LANGUAGE_ATTR))
  conversionOutput.node.setLanguage(language)
}
