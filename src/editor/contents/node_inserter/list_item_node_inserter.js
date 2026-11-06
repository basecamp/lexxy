import { $isDecoratorNode, $isElementNode, $isLineBreakNode, $isRangeSelection, $isRootOrShadowRoot, $splitNode } from "lexical"
import { $isListItemNode, $isListNode, ListItemNode } from "@lexical/list"
import { $isQuoteNode } from "@lexical/rich-text"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $isBlankNode } from "../../../helpers/lexical_helper"
import BaseNodeInserter from "./base_node_inserter"

// A list item can only hold inline content, so a block node (such as an image
// attachment) dropped into one corrupts the list: Lexical lifts it into the
// wrong list item and orphans an empty bullet. Block nodes belong at the top
// level instead, splitting the list around the cursor. Inline content keeps
// Lexical's default behavior and stays within the list item.
export default class ListItemNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $isRangeSelection(selection) &&
      $getNearestNodeOfType(selection.anchor.getNode(), ListItemNode)
  }

  insertNodes(nodes) {
    if (nodes.some(node => this.#isBlockDecorator(node))) {
      this.#insertAroundList(nodes)
    } else {
      this.selection.insertNodes(nodes)
    }
  }

  #insertAroundList(nodes) {
    if (!this.selection.isCollapsed()) { this.selection.removeText() }

    // Break out of any nesting to the outermost list. Splitting an inner list
    // would leave the block stranded inside an ancestor list item, which is the
    // very corruption we are avoiding. The block must land at the list's level.
    const anchorNode = this.selection.anchor.getNode()
    const outerList = this.#outermostList(anchorNode)

    // removeText() can relocate the anchor before we read it back — clean out
    // of the list when the removed range spanned it. With no list left to
    // split, default insertion applies.
    if (!outerList) {
      this.selection.insertNodes(nodes)
      return
    }

    const topItem = this.#topLevelItemFor(anchorNode, outerList)
    const splitIndex = this.#splitIndexFor(topItem)
    const splitsList = splitIndex > 0 && splitIndex < outerList.getChildrenSize()
    const [ listBefore, listAfter ] = this.#split(outerList, splitIndex)
    if (topItem && this.#isBareInsertionPoint(topItem)) { topItem.remove() }
    if (splitsList) this.#continueNumbering(outerList, $firstListIn(listAfter))

    let anchor = listBefore ?? listAfter
    for (const node of nodes) {
      anchor.insertAfter(node)
      anchor = node
    }

    this.#removeEmptyList(listBefore)
    this.#removeEmptyList(listAfter)
    nodes.at(-1).selectNext()
  }

  // A blank top-level bullet is just the insertion point (e.g. the user pressed
  // Enter to leave the list); break out of it entirely. A bullet holding only a
  // soft line break was kept on purpose, so it stays. A bullet with content —
  // including one wrapping a nested list — splits so its content stays in the
  // list. With no top-level bullet at all — removeText() relocated the anchor
  // onto the list node itself — the anchor offset is the boundary between items.
  #splitIndexFor(topItem) {
    if (!topItem) return this.selection.anchor.offset

    const splitAfterItem = this.#isBareInsertionPoint(topItem) ? topItem.getPreviousSibling() : topItem
    return splitAfterItem ? splitAfterItem.getIndexWithinParent() + 1 : 0
  }

  // $splitNode splits every ancestor up to the root, so a list inside a quote
  // splits the quote too. Given an index past the last child, it moves the whole
  // list into the second half, which would put the block before the list; split
  // the parent after the list instead.
  #split(node, index) {
    const parent = node.getParent()
    if (index < node.getChildrenSize() || $isRootOrShadowRoot(parent)) {
      return $splitNode(node, index)
    } else {
      return this.#split(parent, node.getIndexWithinParent() + 1)
    }
  }

  #isBareInsertionPoint(item) {
    return $isBlankNode(item) && !$containsLineBreak(item)
  }

  // Splitting a numbered list copies its start, so the second half would count
  // from 1 again. Continue it from where the first half ends instead. The first
  // half is the split list itself; $splitNode moves the rest into a copy.
  #continueNumbering(listBefore, listAfter) {
    if (!listAfter || listBefore.isEmpty() || listAfter.isEmpty()) return
    if (listBefore.getListType() !== "number") return

    const numberedItems = listBefore.getChildren().filter(item => !$isNestedListWrapper(item))
    listAfter.setStart(listBefore.getStart() + numberedItems.length)
  }

  #outermostList(node) {
    return [ node, ...node.getParents() ].reverse().find($isListNode)
  }

  #topLevelItemFor(node, outerList) {
    return [ node, ...node.getParents() ].find(ancestor =>
      $isListItemNode(ancestor) && ancestor.getParent()?.is(outerList)
    )
  }

  // For a list inside a quote, each half is a quote holding a list.
  #removeEmptyList(node) {
    if ($isElementNode(node)) {
      node.getChildren().forEach(child => this.#removeEmptyList(child))
      if (($isListNode(node) || $isQuoteNode(node)) && node.isEmpty()) node.remove()
    }
  }

  // Only block decorator nodes (image/file attachments) are intercepted. A list
  // item cannot hold them, so they must break out. Pasted element blocks
  // (paragraphs, quotes) keep Lexical's own list-escape semantics.
  #isBlockDecorator(node) {
    return $isDecoratorNode(node) && !node.isInline()
  }
}

// For a list inside quotes, the second half of the split is a quote (or a chain
// of nested quotes) that starts with the copy of the list.
function $firstListIn(node) {
  if ($isListNode(node)) return node
  if ($isQuoteNode(node)) return $firstListIn(node.getFirstChild())
  return null
}

function $containsLineBreak(node) {
  return node.getChildren().some(child => $isLineBreakNode(child) || ($isElementNode(child) && $containsLineBreak(child)))
}

// A list item that only wraps a nested list takes no number of its own.
function $isNestedListWrapper(item) {
  return $isListItemNode(item) && item.getChildrenSize() === 1 && $isListNode(item.getFirstChild())
}
