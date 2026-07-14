import { $caretFromPoint, $createNodeSelection, $createParagraphNode, $findMatchingParent, $getCaretInDirection, $getCaretRange, $getChildCaret, $getCommonAncestor, $getRoot, $getSelection, $getSiblingCaret, $isChildCaret, $isDecoratorNode, $isElementNode, $isExtendableTextPointCaret, $isLineBreakNode, $isParagraphNode, $isRangeSelection, $isRootNode, $isRootOrShadowRoot, $isSiblingCaret, $isTextNode, $isTextPointCaret, $normalizeCaret, $normalizeSelection__EXPERIMENTAL as $normalizeSelection, $rewindSiblingCaret, $setSelectionFromCaretRange, $splitAtPointCaretNext, TextNode } from "lexical"
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

export function $isSafeForRoot(node) {
  return ($isElementNode(node) || $isDecoratorNode(node)) && !node.isParentRequired()
}

export function $makeSafeForRoot(node) {
  if ($isSafeForRoot(node)) {
    return node
  } else if (node.getParent()) {
    return $wrapNodeInElement(node, () => node.createParentElementNode())
  } else {
    // Detached nodes (e.g. clipboard nodes being inserted) can't be `replace`d in place,
    // so append them into a fresh required parent instead.
    return node.createParentElementNode().append(node)
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

// Returns the document text up to `offset` inside `targetNode`. Non-inline
// element siblings are joined with `\n\n`, matching Lexical's own
// ElementNode.getTextContent behavior.
export function $textBeforeOffset(targetNode, offset) {
  const parts = []
  let done = false

  function visit(node) {
    if (done) return
    if (node === targetNode) {
      parts.push(node.getTextContent().slice(0, offset))
      done = true
      return
    }
    if ($isElementNode(node)) {
      const children = node.getChildren()
      for (let i = 0; i < children.length; i++) {
        visit(children[i])
        if (done) return
        const child = children[i]
        if ($isElementNode(child) && !child.isInline() && i < children.length - 1) {
          parts.push("\n\n")
        }
      }
    } else {
      parts.push(node.getTextContent())
    }
  }

  visit($getRoot())
  return parts.join("")
}

export function isAttachmentSpacerTextNode(node, previousNode, index, childCount) {
  return $isTextNode(node)
    && node.getTextContent() === " "
    && index === childCount - 1
    && previousNode instanceof CustomActionTextAttachmentNode
}

export function $splitSelectedParagraphsAtInnerLineBreaks(selection) {
  const topLevelElements = new Set()
  for (const node of selection.getNodes()) {
    const topLevel = node.getTopLevelElement()
    if (topLevel) topLevelElements.add(topLevel)
  }

  for (const element of topLevelElements) {
    if (!$isParagraphNode(element)) continue

    const children = element.getChildren()
    if (!children.some($isLineBreakNode)) continue

    const groups = [ [] ]
    for (const child of children) {
      if ($isLineBreakNode(child)) {
        groups.push([])
        child.remove()
      } else {
        groups[groups.length - 1].push(child)
      }
    }

    for (const group of groups) {
      if (group.length === 0) continue
      const paragraph = $createParagraphNode()
      group.forEach(child => paragraph.append(child))
      element.insertBefore(paragraph)
    }
    if (groups.some(group => group.length > 0)) element.remove()
  }
}

export function $expandSelectionToLineBreaksAndSplitAtEdges(selection, fallbackAncestor = (node) => node.getTopLevelElement()) {
  $ensureForwardRangeSelection(selection)
  $shrinkSelectionPastBlockEdges(selection)

  const focusCaret = $caretFromPoint(selection.focus, "next")
  const anchorCaret = $caretFromPoint(selection.anchor, "previous")

  // A collapsed cursor adjacent to a <br> would claim it from both sides via
  // inward-edge; force outward-only walks so each side finds its own boundary.
  const skipInwardEdge = selection.isCollapsed()
  const focusBrCaret = $getCaretAtLineBreakBoundary(focusCaret, skipInwardEdge)
  let anchorBrCaret = $getCaretAtLineBreakBoundary(anchorCaret, skipInwardEdge)

  if (focusBrCaret?.origin.is(anchorBrCaret?.origin)) {
    anchorBrCaret = null
  }

  // Splitting focus first keeps the anchor <br>'s position stable.
  const focusOuter = focusBrCaret && $splitAroundLineBreak(focusBrCaret)
  const anchorOuter = anchorBrCaret && $splitAroundLineBreak(anchorBrCaret)

  const innerStart = anchorOuter?.getNextSibling() ?? fallbackAncestor(selection.anchor.getNode())
  const innerEnd = focusOuter?.getPreviousSibling() ?? fallbackAncestor(selection.focus.getNode())
  if (!innerStart || !innerEnd) return

  $setSelectionFromCaretRange($getCaretRange(
    $normalizeCaret($getChildCaret(innerStart, "next")),
    $getCaretInDirection(
      $normalizeCaret($getChildCaret(innerEnd, "previous")),
      "next",
    ),
  ))
}

// A selection whose anchor sits at the very end of one block while its focus
// lives in a later block (e.g. selecting a pasted paragraph when the browser
// anchors at the end of the line above) contributes nothing from the anchor's
// block. Pull each endpoint that is flush against a block edge into the block
// that actually holds the selected content, so we don't wrap the empty edge
// block too.
function $shrinkSelectionPastBlockEdges(selection) {
  if (selection.isCollapsed()) return

  const anchorBlock = selection.anchor.getNode().getTopLevelElement()
  const focusBlock = selection.focus.getNode().getTopLevelElement()
  if (!anchorBlock || !focusBlock || anchorBlock.is(focusBlock)) return

  if ($isAtBlockEnd(selection.anchor, anchorBlock)) {
    const nextBlock = anchorBlock.getNextSibling()
    if ($isElementNode(nextBlock)) selection.anchor.set(nextBlock.getKey(), 0, "element")
  }

  if ($isAtBlockStart(selection.focus, focusBlock)) {
    const previousBlock = focusBlock.getPreviousSibling()
    if ($isElementNode(previousBlock)) selection.focus.set(previousBlock.getKey(), previousBlock.getChildrenSize(), "element")
  }
}

function $isAtBlockEnd(point, block) {
  return $isAtBlockBoundary($caretFromPoint(point, "next"), block)
}

function $isAtBlockStart(point, block) {
  return $isAtBlockBoundary($caretFromPoint(point, "previous"), block)
}

// A text point sitting mid-node still has content ahead of it in the caret's
// direction, even though that content is not a sibling node. $getNodeAtCaret
// only sees siblings, so check the text edge before walking the block.
function $isAtBlockBoundary(caret, block) {
  if ($isTextPointCaret(caret) && $isExtendableTextPointCaret(caret)) return false

  let cursor = $normalizeCaret(caret)
  while (cursor && block.isParentOf(cursor.origin)) {
    if (cursor.getNodeAtCaret()) return false
    cursor = cursor.getParentCaret()
  }
  return true
}

function $getCaretAtLineBreakBoundary(caret, skipInwardEdge = false) {
  const paragraph = caret.origin.getTopLevelElement()
  if (!paragraph || !$isParagraphNode(paragraph)) return null

  const lineBreak = (skipInwardEdge ? null : $inwardEdgeLineBreak(caret, paragraph))
    ?? $outwardLineBreak(caret, paragraph)

  return lineBreak ? $getSiblingCaret(lineBreak, caret.direction) : null
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
  if (caret.getParentAtCaret().is(paragraph)) {
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

// Lexical's RangeSelection.insertNodes/insertLineBreak require every selection point to have a
// block ancestor with inline children. An element point on a container of block nodes — e.g. a
// quote holding paragraphs — has none, so Lexical throws invariant #211 or #212. This detects
// such a point so callers can descend it to a leaf before inserting.
export function $isPointOnBlockContainer(point) {
  if (point.type !== "element") return false

  const firstChild = point.getNode().getFirstChild()
  return ($isElementNode(firstChild) || $isDecoratorNode(firstChild)) && !firstChild.isInline()
}

export function $hasPointOnBlockContainer(selection) {
  return $isRangeSelection(selection) &&
    [ selection.anchor, selection.focus ].some($isPointOnBlockContainer)
}

// Descend any block-container element point in the selection to a leaf position, so a subsequent
// Lexical insert (insertNodes, insertLineBreak, INSERT_PARAGRAPH) doesn't throw invariant #211/#212.
export function $normalizeBlockContainerSelection(selection = $getSelection()) {
  if (!$hasPointOnBlockContainer(selection)) return false

  $normalizeSelection(selection)
  return true
}

export function $consecutiveSiblingGroups(blocks) {
  const ordered = [ ...blocks ].sort((a, b) => a.getIndexWithinParent() - b.getIndexWithinParent())
  const groups = []

  for (const block of ordered) {
    const lastGroup = groups.at(-1)
    const previous = lastGroup?.at(-1)

    if (previous && previous.getParent().is(block.getParent()) && previous.getNextSibling()?.is(block)) {
      lastGroup.push(block)
    } else {
      groups.push([ block ])
    }
  }

  return groups
}

