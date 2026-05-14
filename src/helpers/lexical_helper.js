import { $createNodeSelection, $createParagraphNode, $findMatchingParent, $getCommonAncestor, $getSelection, $getSiblingCaret, $isDecoratorNode, $isElementNode, $isLineBreakNode, $isParagraphNode, $isRangeSelection, $isRootNode, $isRootOrShadowRoot, $isTextNode, $splitNode, LineBreakNode, TextNode } from "lexical"
import { ListNode } from "@lexical/list"
import { $getNearestNodeOfType, $lastToFirstIterator } from "@lexical/utils"
import { $wrapNodeInElement } from "@lexical/utils"
import { $ensureForwardRangeSelection, $isAtNodeEnd } from "@lexical/selection"

import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"

export function $containsRangeSelection(node, selection = $getSelection()) {
  if ($isRangeSelection(selection)) {
    const { commonAncestor } = $getCommonAncestor(selection.focus.getNode(), selection.anchor.getNode())
    return $findMatchingParent(commonAncestor, parent => parent.is(node))
  } else {
    return false
  }
}

export function $createNodeSelectionWith(...nodes) {
  const selection = $createNodeSelection()
  nodes.forEach(node => selection.add(node.getKey()))
  return selection
}

export function $isShadowRoot(node) {
  return $isElementNode(node) && $isRootOrShadowRoot(node) && !$isRootNode(node)
}

export function $makeSafeForRoot(node) {
  if ($isTextNode(node)) {
    return $wrapNodeInElement(node, $createParagraphNode)
  } else if (node.isParentRequired()) {
    const parent = node.createRequiredParent()
    return $wrapNodeInElement(node, parent)
  } else {
    return node
  }
}

export function getListType(node) {
  const list = $getNearestNodeOfType(node, ListNode)
  return list?.getListType() ?? null
}

export function isEditorFocused(editor) {
  const rootElement = editor.getRootElement()
  return rootElement !== null && rootElement.contains(document.activeElement)
}

export function $isAtNodeEdge(point, atStart = null) {
  if (atStart === null) {
    return $isAtNodeEdge(point, true) || $isAtNodeEdge(point, false)
  } else {
    return atStart ? $isAtNodeStart(point) : $isAtNodeEnd(point)
  }
}

export function $isAtNodeStart(point) {
  return point.offset === 0
}

export function extendTextNodeConversion(conversionName, ...callbacks) {
  return extendConversion(TextNode, conversionName, (conversionOutput, element) => ({
    ...conversionOutput,
    forChild: (lexicalNode, parentNode) => {
      const originalForChild = conversionOutput?.forChild ?? (x => x)
      let childNode = originalForChild(lexicalNode, parentNode)


      if ($isTextNode(childNode)) {
        childNode = callbacks.reduce(
          (childNode, callback) => callback(childNode, element) ?? childNode,
          childNode
        )
        return childNode
      }
    }
  }))
}

export function extendConversion(nodeKlass, conversionName, callback = (output => output)) {
  return (element) => {
    const converter = nodeKlass.importDOM()?.[conversionName]?.(element)
    if (!converter) return null

    const conversionOutput = converter.conversion(element)
    if (!conversionOutput) return conversionOutput

    return callback(conversionOutput, element) ?? conversionOutput
  }
}

export function $isCursorOnLastLine(selection) {
  const anchorNode = selection.anchor.getNode()
  const elementNode = $isElementNode(anchorNode) ? anchorNode : anchorNode.getParentOrThrow()
  const children = elementNode.getChildren()
  if (children.length === 0) return true

  const lastChild = children[children.length - 1]

  if (anchorNode === elementNode.getLatest() && selection.anchor.offset === children.length) return true
  if (anchorNode === lastChild) return true

  const lastLineBreakIndex = children.findLastIndex(child => $isLineBreakNode(child))
  if (lastLineBreakIndex === -1) return true

  const anchorIndex = children.indexOf(anchorNode)
  return anchorIndex > lastLineBreakIndex
}

export function $isBlankNode(node) {
  if (node.getTextContent().trim() !== "") return false

  const children = node.getChildren?.()
  if (!children || children.length === 0) return true

  return children.every(child => {
    if ($isLineBreakNode(child)) return true
    return $isBlankNode(child)
  })
}

export function $trimTrailingBlankNodes(parent) {
  for (const child of $lastToFirstIterator(parent)) {
    if ($isBlankNode(child)) {
      child.remove()
    } else {
      break
    }
  }
}

// A list item is structurally empty if it contains no meaningful content.
// Unlike getTextContent().trim() === "", this walks descendants to ensure
// decorator nodes (mentions, attachments whose getTextContent() may return
// invisible characters like \ufeff) are treated as non-empty content.
export function $isListItemStructurallyEmpty(listItem) {
  const children = listItem.getChildren()
  for (const child of children) {
    if ($isDecoratorNode(child)) return false
    if ($isLineBreakNode(child)) continue
    if ($isTextNode(child)) {
      if (child.getTextContent().trim() !== "") return false
    } else if ($isElementNode(child)) {
      if (child.getTextContent().trim() !== "") return false
    }
  }
  return true
}

export function isAttachmentSpacerTextNode(node, previousNode, index, childCount) {
  return $isTextNode(node)
    && node.getTextContent() === " "
    && index === childCount - 1
    && previousNode instanceof CustomActionTextAttachmentNode
}

export function $splitParagraphsAtLineBreakBoundaries(selection) {
  $ensureForwardRangeSelection(selection)

  // Discover both sides' <br>s up front, before any mutation, so each side sees
  // the original paragraph structure. "next" / "previous" is each side's
  // OUTWARD direction.
  let focusLineBreak = $findSplitLineBreak(selection.focus, "next")
  let anchorLineBreak = $findSplitLineBreak(selection.anchor, "previous")

  // Collision: a single <br> sits at the cursor's edge and both sides picked it
  // (one via inward-edge, the other via caret-walk). Happens when a collapsed
  // cursor rests next to a <br>: anchor and focus are at the same position, so
  // their inward-edge and caret-walk converge on the same <br>. The inward-edge
  // side picked a <br> in the wrong direction for its role, so defer that side
  // to its caret-walk alternate.
  if (anchorLineBreak && focusLineBreak && anchorLineBreak.is(focusLineBreak)) {
    const anchorAlt = $findSplitLineBreak(selection.anchor, "previous", true)
    if (!anchorAlt || !anchorAlt.is(anchorLineBreak)) {
      anchorLineBreak = anchorAlt ?? null
    } else {
      focusLineBreak = $findSplitLineBreak(selection.focus, "next", true)
    }
  }

  // Split focus first: anchor's <br> sits at a lower index in the same paragraph,
  // so splitting at the higher index keeps anchor's <br> in the same node at the
  // same index.
  const focusOuter = $performSplit(focusLineBreak, "next")
  const anchorOuter = $performSplit(anchorLineBreak, "previous")

  // After both splits, the selection's paragraphs lie between the two outer
  // paragraphs. Compute the inner edges by sibling navigation rather than
  // tracking nodes through mutations.
  const anchorInner = anchorOuter
    ? anchorOuter.getNextSibling()
    : selection.anchor.getNode().getTopLevelElement()
  const focusInner = focusOuter
    ? focusOuter.getPreviousSibling()
    : selection.focus.getNode().getTopLevelElement()
  if (!anchorInner || !focusInner) return []

  const paragraphs = []
  let p = anchorInner
  while (p) {
    paragraphs.push(p)
    if (p.is(focusInner)) break
    p = p.getNextSibling()
  }

  $setSelectionToParagraphs(selection, paragraphs)
  return paragraphs
}

function $findSplitLineBreak(point, direction, skipInwardEdge = false) {
  const paragraph = point.getNode().getTopLevelElement()
  if (!paragraph || !$isParagraphNode(paragraph)) return null

  const selectionChild = $selectionChildForPoint(point, paragraph, direction)
  if (!selectionChild) return null

  const inwardEdge = skipInwardEdge ? null : $lineBreakAtInwardEdge(point, selectionChild, direction)
  return inwardEdge ?? $caretAtNearestNodeOfType(selectionChild, LineBreakNode, direction)?.origin
}

function $performSplit(lineBreak, direction) {
  if (!lineBreak) return null
  const paragraph = lineBreak.getTopLevelElement()
  if (!paragraph) return null

  const isEdge = $outwardSibling(lineBreak, direction) === null
  let outerParagraph = null
  if (!isEdge) {
    // $splitNode returns [before, after]. The outward piece is `after` for the
    // focus (direction "next") and `before` for the anchor (direction "previous").
    const [ before, after ] = $splitNode(paragraph, lineBreak.getIndexWithinParent())
    outerParagraph = direction === "next" ? after : before
  }
  lineBreak.remove()
  return outerParagraph
}

function $setSelectionToParagraphs(selection, paragraphs) {
  if (paragraphs.length === 0) return
  const first = paragraphs[0]
  const last = paragraphs[paragraphs.length - 1]
  const firstLeaf = first.getFirstDescendant() ?? first
  const lastLeaf = last.getLastDescendant() ?? last
  if ($isTextNode(firstLeaf)) {
    selection.anchor.set(firstLeaf.getKey(), 0, "text")
  } else {
    selection.anchor.set(first.getKey(), 0, "element")
  }
  if ($isTextNode(lastLeaf)) {
    selection.focus.set(lastLeaf.getKey(), lastLeaf.getTextContentSize(), "text")
  } else {
    selection.focus.set(last.getKey(), last.getChildrenSize(), "element")
  }
}

// Returns the paragraph's direct child immediately INWARD of the point — the
// node that "starts" the selection content on this side.
function $selectionChildForPoint(point, paragraph, direction) {
  const pointNode = point.getNode()
  if (pointNode.is(paragraph)) {
    return pointNode.getChildAtIndex($inwardChildIndex(point.offset, direction))
  }
  let child = pointNode
  while (child && !child.getParent()?.is(paragraph)) child = child.getParent()
  return child
}

// A <br> that sits AT the cursor's inward edge:
//   (a) selectionChild is itself a <br>, OR
//   (b) cursor is at the inward edge of selectionChild's text content and
//       selectionChild's inward neighbor in the paragraph is a <br>.
// We defer to the outward walk when another <br> sits further outward — the
// outward walk picks the correct split point in that case.
function $lineBreakAtInwardEdge(point, selectionChild, direction) {
  const candidate = $inwardEdgeCandidate(point, selectionChild, direction)
  if (!candidate) return null
  if ($isLineBreakNode($outwardSibling(candidate, direction))) return null
  return candidate
}

function $inwardEdgeCandidate(point, selectionChild, direction) {
  if ($isLineBreakNode(selectionChild)) return selectionChild
  if (!$isTextNode(point.getNode())) return null
  if (point.offset !== $textInwardEdgeOffset(point.getNode(), direction)) return null
  let n = point.getNode()
  while (n && !n.is(selectionChild)) {
    if ($outwardSibling(n, direction)) return null
    n = n.getParent()
  }
  if (!n?.is(selectionChild)) return null
  const neighbor = $inwardSibling(selectionChild, direction)
  return $isLineBreakNode(neighbor) ? neighbor : null
}

function $caretAtNearestNodeOfType(node, klass, direction) {
  for (const caret of $getSiblingCaret(node, direction)) {
    if (caret.origin instanceof klass) return caret
  }
  return null
}

// Direction-aware sibling helpers. `direction` is the OUTWARD direction from
// the cursor's perspective: "next" for focus, "previous" for anchor.
function $outwardSibling(node, direction) {
  return direction === "next" ? node.getNextSibling() : node.getPreviousSibling()
}

function $inwardSibling(node, direction) {
  return direction === "next" ? node.getPreviousSibling() : node.getNextSibling()
}

// The child index immediately INWARD of a paragraph-typed cursor at `offset`.
function $inwardChildIndex(offset, direction) {
  return direction === "next" ? offset - 1 : offset
}

// The offset at the INWARD edge of a text node.
function $textInwardEdgeOffset(textNode, direction) {
  return direction === "next" ? 0 : textNode.getTextContentSize()
}
