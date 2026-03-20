import { $getSelection, $isRangeSelection, $splitNode, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_NORMAL, INSERT_PARAGRAPH_COMMAND, KEY_ARROW_DOWN_COMMAND, ParagraphNode, defineExtension } from "lexical"
import { CodeNode } from "@lexical/code"
import { ListItemNode } from "@lexical/list"
import { $isQuoteNode } from "@lexical/rich-text"
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils"
import { EarlyEscapeCodeNode } from "../nodes/early_escape_code_node"
import { EarlyEscapeListItemNode } from "../nodes/early_escape_list_item_node"
import { $insertNewParagraphAfter, $isBlankNode, $isCursorOnLastLine, $trimTrailingBlankNodes } from "../helpers/lexical_helper"
import LexxyExtension from "./lexxy_extension"

export class FormatEscapeExtension extends LexxyExtension {

  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/format-escape",
      nodes: [
        EarlyEscapeCodeNode,
        { replace: CodeNode, with: (node) => new EarlyEscapeCodeNode(node.getLanguage()), withKlass: EarlyEscapeCodeNode },
        EarlyEscapeListItemNode,
        { replace: ListItemNode, with: () => new EarlyEscapeListItemNode(), withKlass: EarlyEscapeListItemNode },
      ],
      register(editor) {
        return mergeRegister(
          editor.registerCommand(
            INSERT_PARAGRAPH_COMMAND,
            () => $escapeFromBlockquote(),
            COMMAND_PRIORITY_HIGH
          ),
          editor.registerCommand(
            KEY_ARROW_DOWN_COMMAND,
            (event) => $handleArrowDownInCodeBlock(event),
            COMMAND_PRIORITY_NORMAL
          )
        )
      }
    })
  }
}

function $escapeFromBlockquote() {
  const anchorNode = $getSelection().anchor.getNode()

  const paragraph = $getNearestNodeOfType(anchorNode, ParagraphNode)
  if (!paragraph || !$isBlankNode(paragraph)) return false

  const blockquote = paragraph.getParent()
  if (!blockquote || !$isQuoteNode(blockquote)) return false

  const nonEmptySiblings = paragraph.getNextSiblings().filter(sibling => !$isBlankNode(sibling))

  if (nonEmptySiblings.length > 0) {
    $splitQuoteNode(blockquote, paragraph)
  } else {
    blockquote.insertAfter(paragraph)
    paragraph.selectStart()
  }

  return true
}

function $splitQuoteNode(node, paragraph) {
  const splitQuotes = $splitNode(node, paragraph.getIndexWithinParent())
  splitQuotes[0].insertAfter(paragraph)
  splitQuotes.forEach($trimTrailingBlankNodes)
  paragraph.selectEnd()
}

function $handleArrowDownInCodeBlock(event) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

  const codeNode = EarlyEscapeCodeNode.$fromSelection(selection)
  if (!codeNode) return false

  if ($isCursorOnLastLine(selection) && !codeNode.getNextSibling()) {
    event?.preventDefault()
    $insertNewParagraphAfter(codeNode).selectEnd()
    return true
  }

  return false
}
