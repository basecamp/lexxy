import { $isElementNode, $isRangeSelection, $isRootNode } from "lexical"
import { $findMatchingParent } from "@lexical/utils"
import { $isBlockDecoratorNode } from "../../../helpers/lexical_helper"
import BaseNodeInserter from "./base_node_inserter"

// Lexical's RangeSelection.insertNodes holds on to the caret's block across its own call to
// insertParagraph(), and HeadingNode.insertNewAfter swaps that block for a paragraph when the
// caret is at offset 0. insertNodes then inserts after a node that has left the document and
// Lexical throws invariant #66. An attachment dropped at the start of a block belongs above it
// anyway, so place it there rather than splitting the block around the caret.
export default class BlockStartNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $isRangeSelection(selection) && selection.isCollapsed() && selection.anchor.offset === 0
  }

  insertNodes(nodes) {
    const block = this.#blockAtCaret()

    if (block && nodes.every($isBlockDecoratorNode)) {
      for (const node of nodes) {
        block.insertBefore(node)
      }
    } else {
      this.selection.insertNodes(nodes)
    }
  }

  #blockAtCaret() {
    const block = $findMatchingParent(this.selection.anchor.getNode(), node =>
      $isElementNode(node) && !node.isInline() && !$isRootNode(node)
    )

    // An empty block is already a usable insertion point, and inserting above it would strand it.
    if (block && block.isEmpty()) {
      return null
    } else {
      return block
    }
  }
}
