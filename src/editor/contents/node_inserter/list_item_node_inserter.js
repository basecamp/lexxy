import { $isDecoratorNode, $isRangeSelection, $splitNode } from "lexical"
import { $isListItemNode, $isListNode, ListItemNode } from "@lexical/list"
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
    const topItem = this.#topLevelItemFor(anchorNode, outerList)

    // A blank top-level bullet is just the insertion point (e.g. the user pressed
    // Enter to leave the list); break out of it entirely. A bullet with content —
    // including one wrapping a nested list — splits so its content stays in the list.
    const splitAfterItem = $isBlankNode(topItem) ? topItem.getPreviousSibling() : topItem
    const splitIndex = splitAfterItem ? splitAfterItem.getIndexWithinParent() + 1 : 0
    const [ listBefore, listAfter ] = $splitNode(outerList, splitIndex)
    if ($isBlankNode(topItem)) { topItem.remove() }

    let anchor = listBefore ?? listAfter
    for (const node of nodes) {
      anchor.insertAfter(node)
      anchor = node
    }

    this.#removeEmptyList(listBefore)
    this.#removeEmptyList(listAfter)
    nodes.at(-1).selectNext()
  }

  #outermostList(node) {
    return [ node, ...node.getParents() ].reverse().find($isListNode)
  }

  #topLevelItemFor(node, outerList) {
    return [ node, ...node.getParents() ].find(ancestor =>
      $isListItemNode(ancestor) && ancestor.getParent()?.is(outerList)
    )
  }

  #removeEmptyList(list) {
    if ($isListNode(list) && list.isEmpty()) list.remove()
  }

  // Only block decorator nodes (image/file attachments) are intercepted. A list
  // item cannot hold them, so they must break out. Pasted element blocks
  // (paragraphs, quotes) keep Lexical's own list-escape semantics.
  #isBlockDecorator(node) {
    return $isDecoratorNode(node) && !node.isInline()
  }
}
