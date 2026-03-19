import { $createParagraphNode, $isLineBreakNode, $isParagraphNode } from "lexical"
import { $createListNode, $isListItemNode, $isListNode, ListItemNode } from "@lexical/list"
import { $createQuoteNode, $isQuoteNode } from "@lexical/rich-text"

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
    if (!this.#isInsideBlockquote()) return false
    return this.#isItemEmpty() || this.#isEmptyParagraphInItem(selection)
  }

  #isInsideBlockquote() {
    let node = this
    while (node) {
      if ($isQuoteNode(node)) return true
      node = node.getParent()
    }
    return false
  }

  #isItemEmpty() {
    return this.#isNodeEmpty(this)
  }

  #isEmptyParagraphInItem(selection) {
    const anchorNode = selection.anchor.getNode()
    let node = anchorNode
    while (node) {
      if ($isParagraphNode(node)) {
        return this.#isNodeEmpty(node) && $isListItemNode(node.getParent())
      }
      node = node.getParent()
    }
    return false
  }

  #escapeFromList() {
    const parentList = this.getParent()
    if (!parentList || !$isListNode(parentList)) return

    const blockquote = parentList.getParent()
    const isInBlockquote = blockquote && $isQuoteNode(blockquote)

    if (isInBlockquote) {
      const listItemsAfter = this.#getListItemSiblingsAfter()
      const nonEmptyListItems = listItemsAfter.filter(item => !this.#isNodeEmpty(item))

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
    const blockquoteSiblingsAfterList = this.#getSiblingsAfter(parentList)
    const nonEmptyBlockquoteSiblings = blockquoteSiblingsAfterList.filter(
      sibling => !this.#isNodeEmpty(sibling)
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

    this.#removeTrailingEmptyListItems(parentList)
    this.#removeTrailingEmptyNodes(newBlockquote)

    if (parentList.getChildrenSize() === 0) {
      parentList.remove()

      if (blockquote.getChildrenSize() === 0) {
        blockquote.remove()
      }
    } else {
      this.#removeTrailingEmptyNodes(blockquote)
    }

    return middleParagraph
  }

  #getListItemSiblingsAfter() {
    const siblings = []
    let sibling = this.getNextSibling()

    while (sibling) {
      if ($isListItemNode(sibling)) {
        siblings.push(sibling)
      }
      sibling = sibling.getNextSibling()
    }

    return siblings
  }

  #getSiblingsAfter(node) {
    const siblings = []
    let sibling = node.getNextSibling()

    while (sibling) {
      siblings.push(sibling)
      sibling = sibling.getNextSibling()
    }

    return siblings
  }

  #removeTrailingEmptyListItems(list) {
    const items = list.getChildren()
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]
      if ($isListItemNode(item) && this.#isNodeEmpty(item)) {
        item.remove()
      } else {
        break
      }
    }
  }

  #removeTrailingEmptyNodes(container) {
    const children = container.getChildren()
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i]
      if (this.#isNodeEmpty(child)) {
        child.remove()
      } else {
        break
      }
    }
  }

  #isNodeEmpty(node) {
    if (node.getTextContent().trim() !== "") return false

    const children = node.getChildren?.()
    if (!children || children.length === 0) return true

    return children.every(child => {
      if ($isLineBreakNode(child)) return true
      return this.#isNodeEmpty(child)
    })
  }
}
