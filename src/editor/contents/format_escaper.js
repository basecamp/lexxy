import { $createParagraphNode, $getSelection, $isRangeSelection, $splitNode, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_NORMAL, INSERT_PARAGRAPH_COMMAND, KEY_ARROW_DOWN_COMMAND, ParagraphNode } from "lexical"
import { $isQuoteNode } from "@lexical/rich-text"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $isBlankNode, $isCursorOnLastLine, $trimTrailingBlankNodes } from "../../helpers/lexical_helper"
import { EarlyEscapeCodeNode } from "../../nodes/early_escape_code_node"

export default class FormatEscaper {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
  }

  monitor() {
    this.editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => this.#escapeFromBlockquote(),
      COMMAND_PRIORITY_HIGH
    )

    this.editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => this.#handleArrowDownInCodeBlock(event),
      COMMAND_PRIORITY_NORMAL
    )
  }

  #escapeFromBlockquote() {
    const anchorNode = $getSelection().anchor.getNode()

    const paragraph = $getNearestNodeOfType(anchorNode, ParagraphNode)
    if (!paragraph || !$isBlankNode(paragraph)) return false

    const blockquote = paragraph.getParent()
    if (!blockquote || !$isQuoteNode(blockquote)) return false

    const siblingsAfter = paragraph.getNextSiblings()
    const nonEmptySiblings = siblingsAfter.filter(sibling => !$isBlankNode(sibling))

    if (nonEmptySiblings.length > 0) {
      this.#splitBlockquote(blockquote, paragraph)
    } else {
      blockquote.insertAfter(paragraph)
      paragraph.selectStart()
    }

    return true
  }

  #splitBlockquote(blockquote, emptyParagraph) {
    const splitQuotes = $splitNode(blockquote, emptyParagraph.getIndexWithinParent())

    splitQuotes[1].insertAfter(emptyParagraph)
    splitQuotes.forEach($trimTrailingBlankNodes)

    emptyParagraph.selectEnd()
  }

  #handleArrowDownInCodeBlock(event) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

    const codeNode = EarlyEscapeCodeNode.$fromSelection(selection)
    if (!codeNode) return false

    if ($isCursorOnLastLine(selection) && !codeNode.getNextSibling()) {
      event?.preventDefault()
      const paragraph = $createParagraphNode()
      codeNode.insertAfter(paragraph)
      paragraph.selectEnd()
      return true
    }

    return false
  }

}
