import { $createParagraphNode, $getSelection, $isNodeSelection, $isRangeSelection, COMMAND_PRIORITY_HIGH, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_UP_COMMAND, KEY_ENTER_COMMAND, SELECTION_CHANGE_COMMAND, defineExtension } from "lexical"
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils"
import { $isAtNodeEnd } from "@lexical/selection"

import { $isImageGalleryNode, ImageGalleryNode } from "../nodes/image_gallery_node"
import { ActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node.js"

import LexxyExtension from "./lexxy_extension"

export class AttachmentsExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsAttachments
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/action-text-attachments",
      nodes: [
        ActionTextAttachmentNode,
        ActionTextAttachmentUploadNode,
        ImageGalleryNode
      ],
      register(editor) {
        return mergeRegister(
          editor.registerCommand(SELECTION_CHANGE_COMMAND, $ensureGalleryChildSelection, COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_ENTER_COMMAND, $insertParagraphAfterNode, COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_ARROW_UP_COMMAND, () => $selectSibling("up"), COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_ARROW_DOWN_COMMAND, () => $selectSibling("down"), COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_ARROW_LEFT_COMMAND, () => $selectSiblingAtEdge("start"), COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, () => $selectSiblingAtEdge("end"), COMMAND_PRIORITY_HIGH)
        )
      }
    })
  }
}

function $ensureGalleryChildSelection() {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || selection.anchor.type !== "element") return false

  const { anchor, focus } = selection
  const topElement = anchor.getNode().getTopLevelElement()

  if ($isImageGalleryNode(topElement)) {
    topElement.select(anchor.offset, focus.offset)
    return true
  } else {
    return false
  }
}

function $insertParagraphAfterNode() {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) return false

  const focusNode = selection.getNodes()?.at(0)
  const isAttachment = $getNearestNodeOfType(focusNode, ActionTextAttachmentNode)

  if (isAttachment) {
    const paragraph = $createParagraphNode()
    focusNode.insertAfter(paragraph)
    paragraph.selectStart()
    return true
  }
}

function $selectSibling(direction, select = "start") {
  const selection = $getSelection()
  const [ focusNode ] = selection?.getNodes() || []
  const topLevelFocus = focusNode?.getTopLevelElement()
  const topLevelSibling = direction === "up" ? topLevelFocus.getPreviousSibling() : topLevelFocus.getNextSibling()

  if (topLevelSibling && $isImageGalleryNode(topLevelSibling)) {
    const target = select === "start" ? topLevelSibling.getFirstChild() : topLevelSibling.getLastChild()
    target.select()
    return true
  } else {
    return false
  }
}

function $selectSiblingAtEdge(edge = "start") {
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
    return $selectSibling(...args)
  } else {
    return false
  }
}
