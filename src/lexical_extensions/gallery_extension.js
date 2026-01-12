import { $createParagraphNode, $getChildCaret, $getNodeFromDOMNode, $getSelection, $insertNodes, $isDecoratorNode, $isElementNode, $isRangeSelection, $splitNode, CLICK_COMMAND, COMMAND_PRIORITY_HIGH, defineExtension, isDOMNode, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_UP_COMMAND, KEY_ENTER_COMMAND } from "lexical"
import { $getNearestNodeOfType, $wrapNodeInElement, mergeRegister } from "@lexical/utils"
import { $isImageGalleryNode, ImageGalleryNode } from "../nodes/image_gallery_node"
import { $unwrapNode } from "@lexical/utils"
import { $isActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { $isAtNodeEnd } from "@lexical/selection"

export const ImageGalleryLexicalExtension = defineExtension({
  dependencies: [ /* TODO: future attachment extension */ ],
  name: "lexxy/image_galleries",
  nodes: [
    ImageGalleryNode
  ],
  register(editor) {
    return mergeRegister(
      editor.registerNodeTransform(ImageGalleryNode, $removeEmptyGalleries),
      editor.registerNodeTransform(ImageGalleryNode, $unwrapSoloImages),
      editor.registerNodeTransform(ImageGalleryNode, $splitAtElementNode),
      editor.registerCommand(CLICK_COMMAND, $selectImageGallery, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ENTER_COMMAND, $addParagraph, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, selectSibling("up"), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, selectSibling("down"), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_LEFT_COMMAND, selectSiblingAtEdge("start"), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, selectSiblingAtEdge("end"), COMMAND_PRIORITY_HIGH)
    )
  }
})

function $addParagraph() {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return
  const focusNode = selection.getNodes()?.at(0)
  const parent = $getNearestNodeOfType(focusNode, ImageGalleryNode)

  if (parent) {
    const paragraph = $createParagraphNode()
    focusNode.insertBefore(paragraph)
    paragraph.selectStart()
    return true
  }
}

function selectSibling(direction, select = "start") {
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

function selectSiblingAtEdge(edge = "start") {
  return () => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    const focusNode = (edge === "start") ? selection.anchor.getNode() : selection.focus.getNode()
    const focusParent = focusNode?.getTopLevelElement()
    const isEdgeNode = focusNode && focusParent && (focusNode.is(focusParent) || focusNode.is(edge === "start" ? focusParent.getFirstChild() : focusParent.getLastChild()))
    const isAtEdge = isEdgeNode && (edge === "start" ? selection.anchor.offset === 0 : $isAtNodeEnd(selection.anchor))

    if (isAtEdge) {
      const args = edge === "start" ? [ "up", "end" ] : [ "down", "start" ]
      return selectSibling(...args)()
    } else {
      return false
    }
  }
}

function $unwrapSoloImages(imageGallery) {
  if (imageGallery.getChildrenSize() == 1) {
    const [ selectedNode ] = $getSelection()?.getNodes() || []

    // A selected attachment node indicates deletion cause this unwrap
    const wasSelected = $isActionTextAttachmentNode(selectedNode)
    const child = imageGallery.getFirstChild()
    $unwrapNode(imageGallery)
    if (wasSelected) child.select()
  }
}

// Should happen as `canBeEmpty` is `false`, yet it doesn't happen trigger as we use `splice` for all removals
function $removeEmptyGalleries(imageGallery) {
  if (imageGallery.isEmpty()) {
    imageGallery.remove()
  }
}

function $splitAtElementNode(imageGallery) {
  for (const { origin: child } of $getChildCaret(imageGallery, "next")) {
    if (!$isActionTextAttachmentNode(child)) {
      let pop = child
      if (!$isElementNode(child) || $isDecoratorNode(child)) pop = $wrapNodeInElement(child, $createParagraphNode)
      const [ firstPart ] = $splitNode(imageGallery, pop.getIndexWithinParent())
      pop.remove(false)
      firstPart.insertAfter(pop)
      pop.selectEnd()
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
