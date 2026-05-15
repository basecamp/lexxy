import { $createNodeSelection, $createParagraphNode, $findMatchingParent, $getCommonAncestor, $getSelection, $getSiblingCaret, $isDecoratorNode, $isElementNode, $isLineBreakNode, $isNodeSelection, $isParagraphNode, $isRangeSelection, $isRootNode, $isRootOrShadowRoot, $isTextNode, $splitNode, LineBreakNode, TextNode } from "lexical"
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

export function $singleSelectedNode() {
  const selection = $getSelection()
  if ($isNodeSelection(selection)) {
    const nodes = selection.getNodes()
    return nodes.length === 1 ? nodes[0] : null
  } else {
    return null
  }
}

export function $selectedLabelledDecoratorNode() {
  const node = $singleSelectedNode()
  if (typeof node?.label === "string") {
    return { key: node.getKey(), label: node.label }
  } else {
    return null
  }
}

export function registerLabelledDecoratorSelection(editor, onChange) {
  return editor.registerUpdateListener(() => {
    onChange(editor.getEditorState().read($selectedLabelledDecoratorNode))
  })
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

export function announceFromEditor(editor, message) {
  editor.getRootElement()?.closest("lexxy-editor")?.announce(message)
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

  // Split focus first so the anchor split position stays valid.
  $splitAtNearestLineBreak(selection.focus, "next")
  $splitAtNearestLineBreak(selection.anchor, "previous")
}

function $splitAtNearestLineBreak(point, direction) {
  const paragraph = point.getNode().getTopLevelElement()
  if (!paragraph || !$isParagraphNode(paragraph)) return

  const pointNode = point.getNode()
  const selectionChild = pointNode.getParent().is(paragraph) ? pointNode : pointNode.getParentOrThrow()
  const lineBreakCaret = $caretAtNearestNodeOfType(selectionChild, LineBreakNode, direction)
  if (!lineBreakCaret) return

  const lineBreak = lineBreakCaret.origin
  const isEdge = lineBreakCaret.getNodeAtCaret() === null

  if (!isEdge) {
    $splitNode(paragraph, lineBreak.getIndexWithinParent())
  }

  lineBreak.remove()
}

function $caretAtNearestNodeOfType(node, klass, direction) {
  for (const caret of $getSiblingCaret(node, direction)) {
    if (caret.origin instanceof klass) return caret
  }
  return null
}
