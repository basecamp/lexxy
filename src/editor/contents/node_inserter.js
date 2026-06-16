import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getChildCaretAtIndex, $isDecoratorNode, $isElementNode, $isLineBreakNode, $isNodeSelection, $isRangeSelection, $isTextNode, $normalizeSelection__EXPERIMENTAL as $normalizeSelection } from "lexical"
import { CodeNode } from "@lexical/code"
import { $ensureForwardRangeSelection } from "@lexical/selection"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $isShadowRoot } from "../../helpers/lexical_helper"

export default class NodeInserter {
  static for(selection) {
    const INSERTERS = [
      CodeNodeInserter,
      ShadowRootNodeInserter,
      NodeSelectionNodeInserter,
      BlockContainerNodeInserter
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

class ShadowRootNodeInserter extends NodeInserter {
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

class NodeSelectionNodeInserter extends NodeInserter {
  static handles(selection) {
    return $isNodeSelection(selection)
  }

  insertNodes(nodes) {
    const selectedNodes = this.selection.getNodes()

    // Overrides Lexical's default behavior of _removing_ the currently selected nodes
    // https://github.com/facebook/lexical/blob/v0.38.2/packages/lexical/src/LexicalSelection.ts#L412
    let lastNode = selectedNodes.at(-1)
    let inlineContainer = null

    for (const node of nodes) {
      if (this.#canFollowAtTopLevel(node, lastNode)) {
        lastNode = lastNode.insertAfter(node)
        inlineContainer = null
      } else {
        inlineContainer ??= this.#insertParagraphAfter(lastNode)
        inlineContainer.append(node)
        lastNode = inlineContainer
      }
    }
  }

  #canFollowAtTopLevel(node, lastNode) {
    const followsTopLevelNode = lastNode.is(lastNode.getTopLevelElement())
    return !followsTopLevelNode || $isElementNode(node) || $isDecoratorNode(node)
  }

  #insertParagraphAfter(node) {
    const paragraph = $createParagraphNode()
    node.insertAfter(paragraph)
    return paragraph
  }
}

// Lexical's RangeSelection.insertNodes requires every selection point to have a block
// ancestor with inline children. An element point on a container of block nodes — e.g.
// a quote holding paragraphs — has none, so Lexical throws invariant #211 or #212.
// Descend such points to a leaf position before inserting.
class BlockContainerNodeInserter extends NodeInserter {
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
