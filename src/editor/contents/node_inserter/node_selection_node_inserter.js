import { $isNodeSelection } from "lexical"
import { $makeSafeForRoot } from "../../../helpers/lexical_helper"
import BaseNodeInserter from "./base_node_inserter"

export default class NodeSelectionNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $isNodeSelection(selection)
  }

  insertNodes(nodes) {
    // Overrides Lexical's default behavior of _removing_ the currently selected nodes
    // https://github.com/facebook/lexical/blob/v0.38.2/packages/lexical/src/LexicalSelection.ts#L412
    let lastNode = this.selection.getNodes().at(-1)

    for (const node of nodes) {
      // Inserting after a top-level node would make this one a root child. Inline nodes
      // can't live there (Lexical error #99), so wrap them in their required parent first.
      const nodeToInsert = this.#insertsIntoRoot(lastNode) ? $makeSafeForRoot(node) : node
      lastNode = lastNode.insertAfter(nodeToInsert)
    }
  }

  #insertsIntoRoot(node) {
    return node.is(node.getTopLevelElement())
  }
}
