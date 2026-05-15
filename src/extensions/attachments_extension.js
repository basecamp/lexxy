import { $getSelection, $isDecoratorNode, $isParagraphNode, $splitNode, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_NORMAL, DELETE_CHARACTER_COMMAND, KEY_TAB_COMMAND, defineExtension } from "lexical"
import { mergeRegister } from "@lexical/utils"

import { $findOrCreateGalleryForImage, $isImageGalleryNode, ImageGalleryNode } from "../nodes/image_gallery_node"
import { $isActionTextAttachmentNode, ActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node.js"
import { AttachmentDragAndDrop } from "../editor/attachments/drag_and_drop"
import { AttachmentFakeSelection } from "../editor/attachments/fake_selection"
import { AttachmentKeyboardMove } from "../editor/attachments/keyboard_move"
import { DecoratorNodeCaret } from "../editor/attachments/decorator_node_caret"
import { $isAtNodeEdge, $singleSelectedNode } from "../helpers/lexical_helper"

import LexxyExtension from "./lexxy_extension"

const ATTACHMENT_ATTRIBUTES = [ "alt", "caption", "content", "content-type", "data-direct-upload-id",
  "data-sgid", "filename", "filesize", "height", "presentation", "previewable", "sgid", "url", "width" ]

export class AttachmentsExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsAttachments
  }

  get allowedElements() {
    return [ { tag: ActionTextAttachmentNode.TAG_NAME, attributes: ATTACHMENT_ATTRIBUTES } ]
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
        const dragAndDrop = new AttachmentDragAndDrop(editor)
        const keyboardMove = new AttachmentKeyboardMove(editor)
        const fakeSelection = new AttachmentFakeSelection(editor)
        const decoratorNodeCaret = new DecoratorNodeCaret(editor)

        return mergeRegister(
          editor.registerNodeTransform(ActionTextAttachmentNode, $extractAttachmentFromParagraph),
          editor.registerCommand(DELETE_CHARACTER_COMMAND, $collapseIntoGallery, COMMAND_PRIORITY_NORMAL),
          editor.registerCommand(KEY_TAB_COMMAND, $focusCaptionFromSelectedAttachment(), COMMAND_PRIORITY_HIGH),
          () => dragAndDrop.destroy(),
          () => keyboardMove.destroy(),
          () => fakeSelection.destroy(),
          () => decoratorNodeCaret.destroy()
        )
      }
    })
  }
}

// Decorator nodes can be wrapped in a Paragraph Node by Lexical when contained in a <div>
// We remove them, splitting the node as needed
function $extractAttachmentFromParagraph(attachmentNode) {
  const parentNode = attachmentNode.getParent()
  if (!$isParagraphNode(parentNode)) return

  if (parentNode.getChildrenSize() === 1) {
    parentNode.replace(attachmentNode)
  } else {
    const index = attachmentNode.getIndexWithinParent()
    const [ topParagraph, bottomParagraph ] = $splitNode(parentNode, index)
    topParagraph.insertAfter(attachmentNode)

    for (const p of [ topParagraph, bottomParagraph ]) {
      if (p.isEmpty()) p.remove()
    }
  }
}

function $collapseIntoGallery(backwards) {
  const anchor = $getSelection()?.anchor
  if (!anchor) return false

  if ($collapseAtGalleryEdge(anchor, backwards)) {
    return true
  } else if (backwards) {
    return $collapseAroundEmptyParagraph(anchor)
      || $moveSelectionBeforeGallery(anchor)
  }

  return false
}

function $collapseAroundEmptyParagraph(anchor) {
  const anchorNode = anchor.getNode()
  if (!anchorNode) return false

  const isWithinEmptyParagraph = $isParagraphNode(anchorNode) && anchorNode.isEmpty()
  const previousSibling = anchorNode.getPreviousSibling()
  const topGallery = $findOrCreateGalleryForImage(previousSibling)
  const selectionIndex = topGallery?.getChildrenSize()

  if (isWithinEmptyParagraph && topGallery?.collapseWith(anchorNode.getNextSibling())) {
    topGallery.select(selectionIndex, selectionIndex)
    anchorNode.remove()
    return true
  } else {
    return false
  }
}

function $collapseAtGalleryEdge(anchor, backwards) {
  const anchorNode = anchor.getNode()
  if (!$isImageGalleryNode(anchorNode)) return false

  const isAtGalleryEdge = $isAtNodeEdge(anchor, backwards)
  const sibling = backwards ? anchorNode.getPreviousSibling() : anchorNode.getNextSibling()

  if (isAtGalleryEdge && anchorNode.collapseWith(sibling, backwards)) {
    const selectionOffset = backwards ? 1 : anchorNode.getChildrenSize() - 1
    anchorNode.select(selectionOffset, selectionOffset)
    return true
  } else {
    return false
  }
}

// Tab from a selected attachment moves focus into the caption textarea.
function $focusCaptionFromSelectedAttachment() {
  return (event) => {
    if (!event.shiftKey) {
      const node = $singleSelectedNode()
      if ($isActionTextAttachmentNode(node) && node.focusCaption()) {
        event.preventDefault()
        return true
      }
    }
    return false
  }
}

// Manual selection handling to prevent Lexical merging the gallery with a <p> and unwrapping it
function $moveSelectionBeforeGallery(anchor) {
  const previousNode = anchor.getNode().getPreviousSibling()
  if (!$isImageGalleryNode(anchor.getNode()) || !$isAtNodeEdge(anchor, true) || !previousNode) return false

  if ($isDecoratorNode(previousNode)) {
    // Handled by Lexxy decorator selection behavior
    return false
  } else if (previousNode.isEmpty()) {
    previousNode.remove()
  } else {
    previousNode.selectEnd()
  }

  return true
}
