import {
  $createRangeSelection,
  $extendCaretToRange,
  $getNearestNodeFromDOMNode,
  $getSiblingCaret,
  $getTextPointCaret,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  defineExtension,
  isDOMNode
} from "lexical"
import LexxyExtension from "./lexxy_extension"

// Clamps triple-click selection to a "visual line" — the contiguous run of leaf
// content bounded by LineBreakNode descendants within the smallest enclosing
// non-inline block. Fills the gap left by browser/Lexical handling, which
// respects <p> boundaries but not <br> boundaries inside a single block.
//
// For triple-click-drag, expands line-granularly from the line containing the
// drag-start (resolved from the captured mousedown coords) to the line
// containing the drag-end (resolved from click event coords). Intermediate
// lines, including any between blocks, are fully included.
export class VisualLineSelectionExtension extends LexxyExtension {
  #lastTripleMousedown = null

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/visual-line-selection",
      register: (editor) => {
        const handleMousedown = (event) => {
          if (event.detail === 3) {
            this.#lastTripleMousedown = { x: event.clientX, y: event.clientY }
          }
        }
        const unregisterRoot = editor.registerRootListener((rootElement, prevRootElement) => {
          prevRootElement?.removeEventListener("mousedown", handleMousedown)
          rootElement?.addEventListener("mousedown", handleMousedown)
        })
        const unregisterCommand = editor.registerCommand(CLICK_COMMAND, this.#handleClick.bind(this), COMMAND_PRIORITY_LOW)
        return () => {
          unregisterRoot()
          unregisterCommand()
        }
      }
    })
  }

  #handleClick(event) {
    if (event.detail !== 3) return false

    // Lexxy's default decorator click handler (elsewhere) turns this into a
    // NodeSelection — fall through so we don't override it with a RangeSelection.
    // Check event.target rather than the coord-resolved node because
    // caretRangeFromPoint (webkit's fallback) may not resolve to the decorator
    // node for a click landing on its rendered DOM.
    if (isDOMNode(event.target) && $isDecoratorNode($getNearestNodeFromDOMNode(event.target))) return false

    const mousedown = this.#lastTripleMousedown
    this.#lastTripleMousedown = null

    const dragEndNode = $resolveLexicalNodeAtPoint(event.clientX, event.clientY)
    if (!dragEndNode) return false

    const dragStartNode = mousedown
      ? ($resolveLexicalNodeAtPoint(mousedown.x, mousedown.y) ?? dragEndNode)
      : dragEndNode

    return $applyClampedSelection(dragStartNode, dragEndNode)
  }
}

// Resolve the node based on point coordinates, not event.target, because:
//   - Clicks on whitespace between children have event.target = the containing block, which can't
//     tell us which child the user was aiming at.
//   - Click events synthesized from a drag fire on the common ancestor of mousedown and mouseup per
//     the DOM spec — losing the cursor's destination for within-block triple-click-drag.
function $resolveLexicalNodeAtPoint(clientX, clientY) {
  const caretPosition = $caretPositionFromPoint(clientX, clientY)
  if (!caretPosition) return null

  const { offsetNode, offset } = caretPosition

  if (offsetNode.nodeType === Node.ELEMENT_NODE) {
    // Element offsets sit between children. `offset` points to the child
    // immediately after the caret — visually the side a triple-click hit. Fall
    // back to the previous child when the caret sits past the last child.
    const candidate = offsetNode.childNodes[offset] ?? offsetNode.childNodes[offset - 1]
    if (candidate) return $getNearestNodeFromDOMNode(candidate)
  }

  return $getNearestNodeFromDOMNode(offsetNode)
}

function $caretPositionFromPoint(x, y) {
  if (document.caretPositionFromPoint) {
    return document.caretPositionFromPoint(x, y)
  }
  // WebKit (Safari) does not support caretPositionFromPoint.
  const range = document.caretRangeFromPoint?.(x, y)
  return range ? { offsetNode: range.startContainer, offset: range.startOffset } : null
}

function $applyClampedSelection(dragStartNode, dragEndNode) {
  if (dragStartNode.is(dragEndNode) && $isLineBreakNode(dragStartNode)) {
    return $applyCollapsedAtLineBreak(dragStartNode)
  }

  const [ earlier, later ] = $orderInDocument(dragStartNode, dragEndNode)
  const earlierBlock = $findClampingBlock(earlier)
  const laterBlock = $findClampingBlock(later)

  const [ startNode, startHitBoundary ] = $walkToLineBoundary(earlier, "previous", earlierBlock)
  const [ endNode, endHitBoundary ] = $walkToLineBoundary(later, "next", laterBlock)

  // Same block with no <br>s and no nested blocks — nothing to clamp; let the
  // browser's default selection stand.
  if (earlierBlock.is(laterBlock) && !startHitBoundary && !endHitBoundary) return false

  return $applyRangeSelection(startNode, endNode)
}

// Collapse at the LineBreakNode's position within its parent — a meaningful
// position between the two visual lines around it.
function $applyCollapsedAtLineBreak(lineBreakNode) {
  const parentKey = lineBreakNode.getParent().getKey()
  const index = lineBreakNode.getIndexWithinParent()
  const selection = $createRangeSelection()
  selection.anchor.set(parentKey, index, "element")
  selection.focus.set(parentKey, index, "element")
  $setSelection(selection)
  return true
}

function $orderInDocument(node1, node2) {
  if (node1.is(node2)) return [ node1, node2 ]
  const selection = $createRangeSelection()
  $setPointAtNode(selection.anchor, node1)
  $setPointAtNode(selection.focus, node2)
  return selection.isBackward() ? [ node2, node1 ] : [ node1, node2 ]
}

function $setPointAtNode(point, node) {
  if ($isTextNode(node)) {
    point.set(node.getKey(), 0, "text")
  } else {
    point.set(node.getParent().getKey(), node.getIndexWithinParent(), "element")
  }
}

// The click's nearest non-inline ancestor. RootNode is non-inline so this
// always terminates.
function $findClampingBlock(node) {
  let current = node
  while (!($isElementNode(current) && !current.isInline())) {
    current = current.getParent()
  }
  return current
}

// Walks carets in `direction` from `clickNode` and returns the farthest content
// node reached before hitting a segment boundary (LineBreakNode or nested
// non-inline block), plus whether a boundary was actually hit. Inline
// ElementNode entry/exit carets are transparent to visual lines.
function $walkToLineBoundary(clickNode, direction, lineBlock) {
  const anchor = $isTextNode(clickNode)
    ? $getTextPointCaret(clickNode, direction, direction === "previous" ? 0 : "next")
    : $getSiblingCaret(clickNode, direction)

  let farthest = clickNode
  for (const caret of $extendCaretToRange(anchor).iterNodeCarets("root")) {
    const node = caret.origin
    if ($isSegmentBoundary(node, lineBlock)) return [ farthest, true ]
    if ($isElementNode(node)) continue
    farthest = node
  }
  return [ farthest, false ]
}

function $isSegmentBoundary(node, lineBlock) {
  return $isLineBreakNode(node) || ($isElementNode(node) && !node.isInline() && !node.is(lineBlock))
}

function $applyRangeSelection(startNode, endNode) {
  const selection = $createRangeSelection()
  const start = $endpointFor(startNode, "start")
  const end = $endpointFor(endNode, "end")
  selection.anchor.set(start.key, start.offset, start.type)
  selection.focus.set(end.key, end.offset, end.type)
  $setSelection(selection)
  return true
}

function $endpointFor(node, side) {
  if ($isTextNode(node)) {
    return { key: node.getKey(), offset: side === "start" ? 0 : node.getTextContentSize(), type: "text" }
  }
  const indexInParent = node.getIndexWithinParent()
  return { key: node.getParent().getKey(), offset: side === "start" ? indexInParent : indexInParent + 1, type: "element" }
}
