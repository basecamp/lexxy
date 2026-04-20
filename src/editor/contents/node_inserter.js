import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getChildCaretAtIndex, $isElementNode, $isLineBreakNode, $isNodeSelection } from "lexical"
import { CodeNode } from "@lexical/code"
import { QuoteNode } from "@lexical/rich-text"
import { $ensureForwardRangeSelection } from "@lexical/selection"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $isShadowRoot } from "../../helpers/lexical_helper"

export default class NodeInserter {
  static for(selection) {
    const INSERTERS = [
      CodeNodeInserter,
      QuoteNodeInserter,
      ShadowRootNodeInserter,
      NodeSelectionNodeInserter
    ]
    const Inserter = INSERTERS.find(inserter => inserter.handles(selection))
    return Inserter ? new Inserter(selection) : selection
  }

  constructor(selection) {
    this.selection = selection
  }
}

class CodeNodeInserter extends NodeInserter {
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

    for (const node of nodes) {
      if (!node.isAttached()) continue
      if (caret.getNodeAtCaret() && $isElementNode(node)) { caret.insert($createLineBreakNode()) }

      caret.insert(this.#convertNodeToCodeChild(node))
    }

    caret.getNodeAtCaret().selectEnd()
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

// Lexical will split a QuoteNode when inserting other Elements - we want them simply inserted as-is
class QuoteNodeInserter extends NodeInserter {
  static handles(selection) {
    return $getNearestNodeOfType(selection.anchor?.getNode(), QuoteNode)
  }

  insertNodes(nodes) {
    if (!this.selection.isCollapsed()) { this.selection.removeText() }

    $ensureForwardRangeSelection(this.selection)
    let lastNode = this.selection.focus.getNode()
    for (const node of nodes) {
      lastNode = lastNode.insertAfter(node)
    }

    lastNode.selectEnd()
  }
}

class ShadowRootNodeInserter extends NodeInserter {
  static handles(selection) {
    return $isShadowRoot(selection?.anchor.getNode())
  }

  insertNodes(nodes) {
    const anchorNode = this.selection.anchor.getNode()
    const paragraph = $createParagraphNode()
    anchorNode.append(paragraph)

    paragraph.selectStart().insertNodes(nodes)
  }
}

class NodeSelectionNodeInserter extends NodeInserter {
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
