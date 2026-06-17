import { $createParagraphNode } from "lexical"
import { $isShadowRoot } from "../../../helpers/lexical_helper"
import BaseNodeInserter from "./base_node_inserter"

export default class ShadowRootNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $isShadowRoot(selection?.anchor?.getNode())
  }

  insertNodes(nodes) {
    const anchorNode = this.selection.anchor.getNode()
    const paragraph = $createParagraphNode()
    anchorNode.append(paragraph)

    paragraph.selectStart().insertNodes(nodes)
  }
}
