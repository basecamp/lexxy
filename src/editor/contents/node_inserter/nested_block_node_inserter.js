import { $createParagraphNode, $isDecoratorNode, $isElementNode, $isLineBreakNode, $isRangeSelection, $isRootOrShadowRoot, $isTextNode } from "lexical"
import { $getNearestBlockElementAncestorOrThrow } from "@lexical/utils"
import BaseNodeInserter from "./base_node_inserter"

// Lexxy nests blocks in containers Lexical considers inline-only, such as
// paragraphs inside a quote. Since 0.50, RangeSelection.insertNodes flattens block
// content pasted into a block whose parent is not a root or shadow root into
// inline content, so pasting two paragraphs into a quote would merge them into
// one. Insert the blocks as siblings of the target block instead, the way Lexical
// did before.
export default class NestedBlockNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    if (!$isRangeSelection(selection)) return false

    const block = $nearestBlock(selection.anchor.getNode())
    const parent = block?.getParent()
    return $isElementNode(block) && !block.isParentRequired() && parent && !$isRootOrShadowRoot(parent)
  }

  insertNodes(nodes) {
    if (!nodes.some($isBlockNode)) {
      this.selection.insertNodes(nodes)
      return
    }

    if (!this.selection.isCollapsed()) this.selection.removeText()

    const targetBlock = $nearestBlock(this.selection.anchor.getNode())
    const blocks = $wrapInlineRuns(nodes)
    const lastToInsert = blocks.at(-1)
    const nodeToSelect = $isElementNode(lastToInsert) ? lastToInsert.getLastDescendant() ?? lastToInsert : lastToInsert

    // Split the target block at the caret; the trailing half rejoins the last
    // inserted block below.
    const trailingBlock = targetBlock.isEmpty() ? null : this.selection.insertParagraph()

    const toInsert = [ ...blocks ]
    if ($isMergeable(toInsert[0], targetBlock)) {
      targetBlock.append(...toInsert.shift().getChildren())
    }

    let anchor = targetBlock
    for (const block of toInsert) {
      anchor.insertAfter(block)
      anchor = block
    }

    const lastInsertedBlock = $isLeafBlock(lastToInsert) ? $nearestBlock(nodeToSelect) : null
    if (trailingBlock && lastInsertedBlock) {
      lastInsertedBlock.append(...trailingBlock.getChildren())
      trailingBlock.remove()
    }

    if (targetBlock.isEmpty()) targetBlock.remove()

    nodeToSelect.selectEnd()

    const lastChild = targetBlock.isAttached() ? targetBlock.getLastChild() : null
    if ($isLineBreakNode(lastChild) && !lastInsertedBlock?.is(targetBlock)) lastChild.remove()
  }
}

function $nearestBlock(node) {
  return $isElementNode(node) && !node.isInline() ? node : $getNearestBlockElementAncestorOrThrow(node)
}

function $isBlockNode(node) {
  return ($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline()
}

// A block holding inline content, such as a paragraph or a heading, but not a
// list, table or quote
function $isLeafBlock(node) {
  if (!$isElementNode(node) || node.isInline() || $isRootOrShadowRoot(node)) return false

  const firstChild = node.getFirstChild()
  return firstChild === null || $isTextNode(firstChild) || $isLineBreakNode(firstChild) || firstChild.isInline()
}

function $isMergeable(node, targetBlock) {
  return $isLeafBlock(node) && !node.isEmpty() && (!targetBlock.isEmpty() || targetBlock.canMergeWhenEmpty())
}

// Consecutive inline nodes become one paragraph, so every inserted node is a block.
function $wrapInlineRuns(nodes) {
  const blocks = []
  let paragraph = null

  for (const node of nodes) {
    if ($isBlockNode(node)) {
      blocks.push(node)
      paragraph = null
    } else {
      if (!paragraph) blocks.push(paragraph = $createParagraphNode())
      paragraph.append(node)
    }
  }

  return blocks
}
