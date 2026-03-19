import { $createParagraphNode, $splitNode, ParagraphNode } from "lexical"
import { $isListItemNode, $isListNode, ListItemNode } from "@lexical/list"
import { $isQuoteNode, QuoteNode } from "@lexical/rich-text"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $isBlankNode, $trimTrailingBlankNodes } from "../helpers/lexical_helper"

export class EarlyEscapeListItemNode extends ListItemNode {
  $config() {
    return this.config("early_escape_listitem", { extends: ListItemNode })
  }

  insertNewAfter(selection, restoreSelection) {
    if (this.#shouldEscape(selection)) {
      return this.#escapeFromList()
    }

    return super.insertNewAfter(selection, restoreSelection)
  }

  #shouldEscape(selection) {
    if (!$getNearestNodeOfType(this, QuoteNode)) return false
    if ($isBlankNode(this)) return true

    const paragraph = $getNearestNodeOfType(selection.anchor.getNode(), ParagraphNode)
    return paragraph && $isBlankNode(paragraph) && $isListItemNode(paragraph.getParent())
  }

  #escapeFromList() {
    const parentList = this.getParent()
    if (!parentList || !$isListNode(parentList)) return

    const blockquote = parentList.getParent()
    const isInBlockquote = blockquote && $isQuoteNode(blockquote)

    if (isInBlockquote) {
      const hasNonEmptyListItems = this.getNextSiblings().some(
        sibling => $isListItemNode(sibling) && !$isBlankNode(sibling)
      )

      if (hasNonEmptyListItems) {
        return this.#splitBlockquoteWithList()
      }
    }

    const paragraph = $createParagraphNode()
    parentList.insertAfter(paragraph)

    this.remove()
    return paragraph
  }

  #splitBlockquoteWithList() {
    const splitQuotes = $splitNode(this.getParent(), this.getIndexWithinParent())
    this.remove()

    const middleParagraph = $createParagraphNode()
    splitQuotes[0].insertAfter(middleParagraph)

    splitQuotes.forEach($trimTrailingBlankNodes)

    return middleParagraph
  }

}
