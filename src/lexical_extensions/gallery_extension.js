import { $createParagraphNode, $getNodeFromDOMNode, $getSelection, $isNodeSelection, $isRangeSelection, CLICK_COMMAND, COMMAND_PRIORITY_HIGH, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_UP_COMMAND, KEY_ENTER_COMMAND, defineExtension, isDOMNode } from "lexical"
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils"
import { $isImageGalleryNode, ImageGalleryNode } from "../nodes/image_gallery_node"
import { $isAtNodeEnd } from "@lexical/selection"

export const ImageGalleryLexicalExtension = defineExtension({
  dependencies: [ /* TODO: future attachment extension */ ],
  name: "lexxy/image_galleries",
  nodes: [
    ImageGalleryNode
  ],
  register(editor) {
    return mergeRegister(
      editor.registerCommand(CLICK_COMMAND, $selectImageGallery, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ENTER_COMMAND, $splitImageGalleryWithParagraph, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, $selectSibling("up"), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, $selectSibling("down"), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_LEFT_COMMAND, $selectSiblingAtEdge("start"), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, $selectSiblingAtEdge("end"), COMMAND_PRIORITY_HIGH)
    )
  }
})

function $splitImageGalleryWithParagraph() {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) return
  const focusNode = selection.getNodes()?.at(0)
  const isInImageGallery = $getNearestNodeOfType(focusNode, ImageGalleryNode)

  if (isInImageGallery) {
    const paragraph = $createParagraphNode()
    focusNode.insertAfter(paragraph)
    paragraph.selectStart()
    return true
  }
}

function $selectSibling(direction, select = "start") {
  return () => {
    const selection = $getSelection()
    const [ focusNode ] = selection?.getNodes() || []
    const topLevelFocus = focusNode?.getTopLevelElement()
    const topLevelSibling = direction === "up" ? topLevelFocus.getPreviousSibling() : topLevelFocus.getNextSibling()

    if (topLevelSibling && $isImageGalleryNode(topLevelSibling)) {
      (select === "start" ? topLevelSibling.getFirstChild().select() : topLevelSibling.getLastChild().select())
      return true
    } else {
      return false
    }
  }
}

function $selectSiblingAtEdge(edge = "start") {
  return () => {
    const selection = $getSelection()
    const isNodeSelection = $isNodeSelection(selection)
    if (!$isRangeSelection(selection) && !isNodeSelection) {
      return false
    }

    const focusNode = isNodeSelection ? selection.getNodes()[0] : (edge === "start") ? selection.anchor.getNode() : selection.focus.getNode()
    const focusParent = focusNode?.getTopLevelElement()
    const isEdgeNode = focusNode && focusParent && (focusNode.is(focusParent) || focusNode.is(edge === "start" ? focusParent.getFirstChild() : focusParent.getLastChild()))
    const isAtEdge = isNodeSelection || isEdgeNode && (edge === "start" ? selection.anchor.offset === 0 : $isAtNodeEnd(selection.anchor))

    if (isAtEdge) {
      const args = edge === "start" ? [ "up", "end" ] : [ "down", "start" ]
      return $selectSibling(...args)()
    } else {
      return false
    }
  }
}

function $selectImageGallery(event) {
  if (!isDOMNode(event.target)) return

  const node = $getNodeFromDOMNode(event.target)
  if ($isImageGalleryNode(node)) {
    node.selectEnd()
    return true
  } else {
    return false
  }
}
