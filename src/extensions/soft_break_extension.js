import {
  $createLineBreakNode,
  $createParagraphNode,
  $getSelection,
  $isLineBreakNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_NORMAL,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
  defineExtension
} from "lexical"
import LexxyExtension from "./lexxy_extension"

export const SoftBreakExtensionDefinition = defineExtension({
  name: "lexxy/soft-break",
  register(editor) {
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => handleEnterKey(event),
      COMMAND_PRIORITY_NORMAL
    )

    editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => handleBackspaceKey(event),
      COMMAND_PRIORITY_NORMAL
    )
  }
})

function handleEnterKey(event) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false
  }

  const anchor = selection.anchor
  const anchorNode = anchor.getNode()
  const paragraph = $findParagraphNode(anchorNode)

  if (!paragraph) {
    return false
  }

  if ($isAtDoubleEnterPosition(anchor, paragraph)) {
    event.preventDefault()
    $handleDoubleEnter(paragraph)
    return true
  }

  event.preventDefault()
  $insertLineBreak(selection)
  return true
}

function handleBackspaceKey(event) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false
  }

  const anchor = selection.anchor
  const anchorNode = anchor.getNode()
  const paragraph = $findParagraphNode(anchorNode)

  if (!paragraph) {
    return false
  }

  if ($isAtParagraphStart(anchor, paragraph)) {
    const previousSibling = paragraph.getPreviousSibling()
    if (previousSibling && $isParagraphNode(previousSibling)) {
      event.preventDefault()
      $mergeParagraphsWithLineBreak(previousSibling, paragraph)
      return true
    }
  }

  return false
}

function $findParagraphNode(node) {
  let currentNode = node
  while (currentNode) {
    if ($isParagraphNode(currentNode)) {
      return currentNode
    }
    currentNode = currentNode.getParent()
  }
  return null
}

function $isAtDoubleEnterPosition(anchor, paragraph) {
  const node = anchor.getNode()

  if (node === paragraph) {
    const offset = anchor.offset
    const children = paragraph.getChildren()

    if (offset === children.length && offset > 0) {
      const lastChild = children[offset - 1]
      return $isLineBreakNode(lastChild)
    }
  }

  if ($isTextNode(node)) {
    const offset = anchor.offset
    if (offset === node.getTextContent().length) {
      const nextSibling = node.getNextSibling()
      if (nextSibling && $isLineBreakNode(nextSibling)) {
        const afterLineBreak = nextSibling.getNextSibling()
        return !afterLineBreak
      }
    }
  }

  if ($isLineBreakNode(node)) {
    const nextSibling = node.getNextSibling()
    return !nextSibling
  }

  return false
}

function $handleDoubleEnter(paragraph) {
  const children = paragraph.getChildren()
  const lastChild = children[children.length - 1]

  if (lastChild && $isLineBreakNode(lastChild)) {
    lastChild.remove()
  }

  const newParagraph = $createParagraphNode()
  paragraph.insertAfter(newParagraph)
  newParagraph.selectStart()
}

function $insertLineBreak(selection) {
  const lineBreak = $createLineBreakNode()
  selection.insertNodes([ lineBreak ])
}

function $isAtParagraphStart(anchor, paragraph) {
  const node = anchor.getNode()
  const offset = anchor.offset

  if (node === paragraph) {
    return offset === 0
  }

  if ($isTextNode(node)) {
    if (offset > 0) {
      return false
    }

    const previousSibling = node.getPreviousSibling()
    return !previousSibling
  }

  return false
}

function $mergeParagraphsWithLineBreak(firstParagraph, secondParagraph) {
  const lineBreak = $createLineBreakNode()
  firstParagraph.append(lineBreak)

  const secondChildren = secondParagraph.getChildren()
  secondChildren.forEach(child => {
    firstParagraph.append(child)
  })

  secondParagraph.remove()

  const selection = $getSelection()
  if ($isRangeSelection(selection)) {
    lineBreak.selectNext()
  }
}

export default class SoftBreakExtension extends LexxyExtension {
  get lexicalExtension() {
    return SoftBreakExtensionDefinition
  }
}
