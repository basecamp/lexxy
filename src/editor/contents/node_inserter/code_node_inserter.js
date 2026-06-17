import { $createLineBreakNode, $createTextNode, $getChildCaretAtIndex, $isElementNode, $isLineBreakNode, $isTextNode } from "lexical"
import { CodeNode } from "@lexical/code"
import { $ensureForwardRangeSelection } from "@lexical/selection"
import { $getNearestNodeOfType } from "@lexical/utils"
import BaseNodeInserter from "./base_node_inserter"

export default class CodeNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $getNearestNodeOfType(selection.anchor?.getNode(), CodeNode)
  }

  insertNodes(nodes) {
    if (!this.selection.isCollapsed()) { this.selection.removeText() }

    $ensureForwardRangeSelection(this.selection)
    const focusNode = this.selection.focus.getNode()
    const codeNode = $getNearestNodeOfType(focusNode, CodeNode)
    const insertionIndex = focusNode.is(codeNode) ? 0 : focusNode.getIndexWithinParent()

    const caret = $getChildCaretAtIndex(codeNode, insertionIndex + 1, "previous")

    // Nodes that are already in the document come from the format-toggle path (existing
    // content converted into this code block). Brand-new nodes (dropped/pasted content)
    // were never attached.
    const existingNodes = new Set(nodes.filter(node => node.isAttached()))
    const trailingNodes = []

    for (const node of nodes) {
      if (existingNodes.has(node)) {
        if (!node.isAttached()) continue // already pulled in when a converted ancestor was removed
      } else if (!this.#canJoinCodeBlock(node)) {
        trailingNodes.push(node) // e.g. a dropped attachment, which a code block can't hold
        continue
      }

      if (caret.getNodeAtCaret() && $isElementNode(node)) { caret.insert($createLineBreakNode()) }
      caret.insert(this.#convertNodeToCodeChild(node))
    }

    const lastTrailingNode = this.#insertAfterCodeBlock(codeNode, trailingNodes)
    const nodeToSelect = lastTrailingNode ?? caret.getNodeAtCaret()
    nodeToSelect?.selectEnd()
  }

  #canJoinCodeBlock(node) {
    return $isTextNode(node) || $isLineBreakNode(node)
  }

  #insertAfterCodeBlock(codeNode, nodes) {
    let previousNode = codeNode
    for (const node of nodes) {
      previousNode.insertAfter(node)
      previousNode = node
    }
    return nodes.at(-1)
  }

  #convertNodeToCodeChild(node) {
    if ($isLineBreakNode(node)) {
      return node
    } else {
      node.remove()
      return $createTextNode(node.getTextContent())
    }
  }
}
