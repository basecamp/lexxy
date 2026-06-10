import { $createParagraphNode, $hasUpdateTag, $splitNode, PASTE_TAG, ParagraphNode } from "lexical"
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
    // Pasting is not an escape gesture. Lexical's insertNodes inserts the pasted blocks
    // after this node, so escaping (which removes it) would leave Lexical referencing
    // a detached node and throw "Expected node to have a parent" (error #66).
    if ($hasUpdateTag(PASTE_TAG)) return false
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
