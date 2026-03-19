import { $createParagraphNode, ParagraphNode } from "lexical"
import { $createListNode, $isListItemNode, $isListNode, ListItemNode } from "@lexical/list"
import { $createQuoteNode, $isQuoteNode, QuoteNode } from "@lexical/rich-text"
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
    return this.#isItemEmpty() || this.#isEmptyParagraphInItem(selection)
  }

  #isItemEmpty() {
    return $isBlankNode(this)
  }

  #isEmptyParagraphInItem(selection) {
    const paragraph = $getNearestNodeOfType(selection.anchor.getNode(), ParagraphNode)
    if (!paragraph) return false
    return $isBlankNode(paragraph) && $isListItemNode(paragraph.getParent())
  }

  #escapeFromList() {
    const parentList = this.getParent()
    if (!parentList || !$isListNode(parentList)) return

    const blockquote = parentList.getParent()
    const isInBlockquote = blockquote && $isQuoteNode(blockquote)

    if (isInBlockquote) {
      const nonEmptyListItems = this.getNextSiblings().filter(
        sibling => $isListItemNode(sibling) && !$isBlankNode(sibling)
      )

      if (nonEmptyListItems.length > 0) {
        return this.#splitBlockquoteWithList(blockquote, parentList, nonEmptyListItems)
      }
    }

    const paragraph = $createParagraphNode()
    parentList.insertAfter(paragraph)

    this.remove()
    return paragraph
  }

  #splitBlockquoteWithList(blockquote, parentList, listItemsAfter) {
    const nonEmptyBlockquoteSiblings = parentList.getNextSiblings().filter(
      sibling => !$isBlankNode(sibling)
    )

    const middleParagraph = $createParagraphNode()
    blockquote.insertAfter(middleParagraph)

    const newList = $createListNode(parentList.getListType())

    const newBlockquote = $createQuoteNode()
    middleParagraph.insertAfter(newBlockquote)
    newBlockquote.append(newList)

    listItemsAfter.forEach(item => {
      newList.append(item)
    })

    nonEmptyBlockquoteSiblings.forEach(sibling => {
      newBlockquote.append(sibling)
    })

    this.remove()

    $trimTrailingBlankNodes(parentList)
    $trimTrailingBlankNodes(newBlockquote)

    if (parentList.getChildrenSize() === 0) {
      parentList.remove()

      if (blockquote.getChildrenSize() === 0) {
        blockquote.remove()
      }
    } else {
      $trimTrailingBlankNodes(blockquote)
    }

    return middleParagraph
  }

}
