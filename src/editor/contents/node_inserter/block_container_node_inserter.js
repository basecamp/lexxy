import { $isDecoratorNode, $isElementNode, $isRangeSelection, $normalizeSelection__EXPERIMENTAL as $normalizeSelection } from "lexical"
import BaseNodeInserter from "./base_node_inserter"

// Lexical's RangeSelection.insertNodes requires every selection point to have a block
// ancestor with inline children. An element point on a container of block nodes — e.g.
// a quote holding paragraphs — has none, so Lexical throws invariant #211 or #212.
// Descend such points to a leaf position before inserting.
export default class BlockContainerNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $isRangeSelection(selection) &&
      [ selection.anchor, selection.focus ].some($isPointOnBlockContainer)
  }

  insertNodes(nodes) {
    $normalizeSelection(this.selection)
    this.selection.insertNodes(nodes)
  }
}

function $isPointOnBlockContainer(point) {
  if (point.type === "element") {
    const firstChild = point.getNode().getFirstChild()
    return ($isElementNode(firstChild) || $isDecoratorNode(firstChild)) && !firstChild.isInline()
  } else {
    return false
  }
}
