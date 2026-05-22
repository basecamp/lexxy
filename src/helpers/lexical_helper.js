import { $caretFromPoint, $createNodeSelection, $createParagraphNode, $findMatchingParent, $getCaretInDirection, $getCommonAncestor, $getSelection, $getSiblingCaret, $isChildCaret, $isDecoratorNode, $isElementNode, $isExtendableTextPointCaret, $isLineBreakNode, $isParagraphNode, $isRangeSelection, $isRootNode, $isRootOrShadowRoot, $isSiblingCaret, $isTextNode, $isTextPointCaret, $rewindSiblingCaret, $splitAtPointCaretNext, TextNode } from "lexical"
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

  const focusCaret = $caretFromPoint(selection.focus, "next")
  const anchorCaret = $caretFromPoint(selection.anchor, "previous")

  let focusBr = $boundaryLineBreak(focusCaret)
  let anchorBr = $boundaryLineBreak(anchorCaret)

  // A collapsed cursor adjacent to a <br> claims it via inward-edge on one
  // side and outward walk on the other; force outward-only on both so each
  // side finds its own boundary.
  if (focusBr && anchorBr && focusBr.is(anchorBr)) {
    focusBr = $boundaryLineBreak(focusCaret, true)
    anchorBr = $boundaryLineBreak(anchorCaret, true)
    if (focusBr && anchorBr && focusBr.is(anchorBr)) {
      anchorBr = null
    }
  }

  // Splitting focus first keeps the anchor <br>'s position stable.
  const focusOuter = focusBr ? $splitAroundLineBreak($getSiblingCaret(focusBr, "next")) : null
  const anchorOuter = anchorBr ? $splitAroundLineBreak($getSiblingCaret(anchorBr, "previous")) : null

  const innerStart = anchorOuter ? anchorOuter.getNextSibling() : selection.anchor.getNode().getTopLevelElement()
  const innerEnd = focusOuter ? focusOuter.getPreviousSibling() : selection.focus.getNode().getTopLevelElement()
  if (!innerStart || !innerEnd) return []

  const paragraphs = []
  for (const c of $rewindSiblingCaret($getSiblingCaret(innerStart, "next"))) {
    paragraphs.push(c.origin)
    if (c.origin.is(innerEnd)) break
  }
  $selectParagraphs(selection, paragraphs)
  return paragraphs
}

function $boundaryLineBreak(caret, skipInwardEdge = false) {
  const paragraph = caret.origin.getTopLevelElement()
  if (!paragraph || !$isParagraphNode(paragraph)) return null

  if (!skipInwardEdge) {
    const br = $inwardEdgeLineBreak(caret, paragraph)
    if (br) return br
  }
  return $outwardLineBreak(caret, paragraph)
}

// Prefer a <br> the cursor is sitting flush against, except when a further <br>
// also exists outward — that one is the real paragraph break for this side.
function $inwardEdgeLineBreak(caret, paragraph) {
  let candidateCaret

  if (
    ($isChildCaret(caret) && caret.origin.is(paragraph)) ||
    ($isTextPointCaret(caret) && $isExtendableTextPointCaret(caret.getFlipped()))
  ) {
    candidateCaret = null
  } else if ($isSiblingCaret(caret) && caret.getParentAtCaret().is(paragraph)) {
    candidateCaret = caret
  } else {
    const childCaret = $paragraphChildCaretAtInwardEdge(caret, paragraph)
    candidateCaret = childCaret ? $rewindSiblingCaret(childCaret) : null
  }

  if (candidateCaret && $isLineBreakNode(candidateCaret.origin)) {
    return $candidateUnlessShadowed(candidateCaret)
  } else {
    return null
  }
}

function $candidateUnlessShadowed(candidateCaret) {
  const outward = candidateCaret.getNodeAtCaret()
  return $isLineBreakNode(outward) ? null : candidateCaret.origin
}

function $outwardLineBreak(caret, paragraph) {
  const startCaret = $outwardWalkStartCaret(caret, paragraph)
  if (!startCaret) return null

  for (const { origin } of startCaret) {
    if (!origin.getParent().is(paragraph)) break
    if ($isLineBreakNode(origin)) return origin
  }
  return null
}

function $outwardWalkStartCaret(caret, paragraph) {
  if (caret.getParentAtCaret()?.is(paragraph)) {
    return caret
  } else {
    return $paragraphChildCaretContaining(caret, paragraph)
  }
}

function $paragraphChildCaretContaining(caret, paragraph) {
  let cursor = caret.getSiblingCaret()
  while (cursor && !cursor.origin.getParent()?.is(paragraph)) {
    cursor = cursor.getParentCaret()
  }
  return cursor?.origin.getParent()?.is(paragraph) ? cursor : null
}

// Only succeeds when the cursor is flush against the inward edge of every
// ancestor between itself and the paragraph child.
function $paragraphChildCaretAtInwardEdge(caret, paragraph) {
  let cursor = caret.getSiblingCaret()
  while (cursor && !cursor.origin.getParent()?.is(paragraph)) {
    if (cursor.getNodeAtCaret()) return null
    cursor = cursor.getParentCaret()
  }
  return cursor?.origin.getParent()?.is(paragraph) ? cursor : null
}

function $splitAroundLineBreak(lineBreakCaret) {
  let outer = null

  if (lineBreakCaret.getNodeAtCaret() === null) {
    lineBreakCaret.origin.remove()
  } else {
    const lineBreak = lineBreakCaret.origin
    const splitCaret = $getCaretInDirection($rewindSiblingCaret(lineBreakCaret), "next")

    $splitAtPointCaretNext(splitCaret)
    outer = lineBreak.getTopLevelElement()
    lineBreak.remove()
  }

  return outer
}

function $selectParagraphs(selection, paragraphs) {
  if (paragraphs.length > 0) {
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
}
