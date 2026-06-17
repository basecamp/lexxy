import { $isNodeSelection } from "lexical"
import BaseNodeInserter from "./base_node_inserter"

export default class NodeSelectionNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $isNodeSelection(selection)
  }

  insertNodes(nodes) {
    const selectedNodes = this.selection.getNodes()

    // Overrides Lexical's default behavior of _removing_ the currently selected nodes
    // https://github.com/facebook/lexical/blob/v0.38.2/packages/lexical/src/LexicalSelection.ts#L412
    let lastNode = selectedNodes.at(-1)
    for (const node of nodes) {
      lastNode = lastNode.insertAfter(node)
    }
  }
}
