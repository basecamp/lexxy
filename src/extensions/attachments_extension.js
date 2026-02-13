import { $createParagraphNode, $getSelection, $isNodeSelection, $isRangeSelection, COMMAND_PRIORITY_HIGH, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_UP_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND, KEY_ENTER_COMMAND, SELECTION_CHANGE_COMMAND, defineExtension } from "lexical"
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils"
import { $isAtNodeEnd } from "@lexical/selection"

import { $findOrCreateGalleryForImage, $isImageGalleryNode, ImageGalleryNode } from "../nodes/image_gallery_node"
import { $isActionTextAttachmentNode, ActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node.js"

import LexxyExtension from "./lexxy_extension"
import { $isProvisionalParagraphNode } from "../nodes/provisional_paragraph_node.js"

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
          //editor.registerCommand(KEY_ENTER_COMMAND, $splitGallery, COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_BACKSPACE_COMMAND, $collapseIntoGallery, COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_DELETE_COMMAND, $collapseIntoGallery, COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_ARROW_UP_COMMAND, () => $selectSibling("up"), COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_ARROW_DOWN_COMMAND, () => $selectSibling("down"), COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_ARROW_LEFT_COMMAND, () => $selectSiblingAtEdge("start"), COMMAND_PRIORITY_HIGH),
          editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, () => $selectSiblingAtEdge("end"), COMMAND_PRIORITY_HIGH)
        )
      }
    })
  }
}

function $insertParagraphAfterNode() {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) return false

  const selectionNode = selection.getNodes()?.at(0)
  const isAttachment = $getNearestNodeOfType(selectionNode, ActionTextAttachmentNode)

  if (isAttachment) {
    const paragraph = $createParagraphNode()
    selectionNode.insertAfter(paragraph)
    paragraph.selectStart()
    return true
  }
}

function $collapseIntoGallery() {
  const selectedNode = $getSelection()?.anchor?.getNode()
  if (!selectedNode) return false

  const isWithinProvisionalParagraph = $isProvisionalParagraphNode(selectedNode)
  const siblings = [ selectedNode.getPreviousSibling(), selectedNode.getNextSibling() ]
  const isBetweenImagesOrGalleries = siblings.every(node => $isImageGalleryNode(node) || ($isActionTextAttachmentNode(node) && node.isPreviewableImage))

  if (isWithinProvisionalParagraph && isBetweenImagesOrGalleries) {
    const [ topGallery, bottomGallery ] = siblings.map($findOrCreateGalleryForImage)
    const selectionIndex = topGallery.getChildrenSize()
    topGallery.merge(bottomGallery)
    topGallery.select(selectionIndex)
    return true
  }

  return false
}

function $splitGallery() {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

  const gallery = selection.anchor.getNode()
  if (!$isImageGalleryNode(gallery)) return false

  const [ , bottomGallery ] = gallery.splitAtIndex(selection.anchor.offset)
  bottomGallery.selectStart()
  return true
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
