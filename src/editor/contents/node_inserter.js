import BaseNodeInserter from "./node_inserter/base_node_inserter"
import CodeNodeInserter from "./node_inserter/code_node_inserter"
import ShadowRootNodeInserter from "./node_inserter/shadow_root_node_inserter"
import NodeSelectionNodeInserter from "./node_inserter/node_selection_node_inserter"
import ListItemNodeInserter from "./node_inserter/list_item_node_inserter"
import BlockContainerNodeInserter from "./node_inserter/block_container_node_inserter"

const INSERTERS = [
  CodeNodeInserter,
  ShadowRootNodeInserter,
  NodeSelectionNodeInserter,
  ListItemNodeInserter,
  BlockContainerNodeInserter
]

// Defined here rather than on the base class so the base can stay free of any
// dependency on its subclasses (they import the base), avoiding an import cycle.
BaseNodeInserter.for = (selection) => {
  const inserterClass = INSERTERS.find(inserter => inserter.handles(selection))
  return inserterClass ? new inserterClass(selection) : selection
}

export default BaseNodeInserter
