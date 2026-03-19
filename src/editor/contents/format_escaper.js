import { $createParagraphNode, $getSelection, $isRangeSelection, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_NORMAL, KEY_ARROW_DOWN_COMMAND, KEY_ENTER_COMMAND, ParagraphNode } from "lexical"
import { $createQuoteNode, $isQuoteNode, QuoteNode } from "@lexical/rich-text"
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
      KEY_ENTER_COMMAND,
      (event) => this.#handleEnterKey(event),
      COMMAND_PRIORITY_HIGH
    )

    this.editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => this.#handleArrowDownInCodeBlock(event),
      COMMAND_PRIORITY_NORMAL
    )
  }

  #handleEnterKey(event) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    const anchorNode = selection.anchor.getNode()

    if (!$getNearestNodeOfType(anchorNode, QuoteNode)) return false

    return this.#handleBlockquotes(event, anchorNode)
  }

  #handleBlockquotes(event, anchorNode) {
    const paragraph = $getNearestNodeOfType(anchorNode, ParagraphNode)
    if (!paragraph || !$isBlankNode(paragraph)) return false

    const parent = paragraph.getParent()
    if (!parent || !$isQuoteNode(parent)) return false

    event.preventDefault()
    this.#escapeFromBlockquote(anchorNode)
    return true
  }

  #escapeFromBlockquote(anchorNode) {
    const paragraph = $getNearestNodeOfType(anchorNode, ParagraphNode)
    if (!paragraph) return

    const blockquote = paragraph.getParent()
    if (!blockquote || !$isQuoteNode(blockquote)) return

    const siblingsAfter = paragraph.getNextSiblings()
    const nonEmptySiblings = siblingsAfter.filter(sibling => !$isBlankNode(sibling))

    if (nonEmptySiblings.length > 0) {
      this.#splitBlockquote(blockquote, paragraph, nonEmptySiblings)
    } else {
      const newParagraph = $createParagraphNode()
      blockquote.insertAfter(newParagraph)
      paragraph.remove()
      newParagraph.selectStart()
    }
  }

  #splitBlockquote(blockquote, emptyParagraph, siblingsAfter) {
    const newParagraph = $createParagraphNode()
    blockquote.insertAfter(newParagraph)

    const newBlockquote = $createQuoteNode()
    newParagraph.insertAfter(newBlockquote)

    newBlockquote.append(...siblingsAfter)

    emptyParagraph.remove()

    $trimTrailingBlankNodes(blockquote)
    $trimTrailingBlankNodes(newBlockquote)

    newParagraph.selectStart()
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
      paragraph.selectStart()
      return true
    }

    return false
  }

}
