import { $getSelection, $isDecoratorNode, $isParagraphNode, COMMAND_PRIORITY_NORMAL, DELETE_CHARACTER_COMMAND, defineExtension } from "lexical"
import { mergeRegister } from "@lexical/utils"
import { $isAtNodeEnd } from "@lexical/selection"

import { $findOrCreateGalleryForImage, $isImageGalleryNode, ImageGalleryNode } from "../nodes/image_gallery_node"
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
          editor.registerCommand(DELETE_CHARACTER_COMMAND, $collapseIntoGallery, COMMAND_PRIORITY_NORMAL)
        )
      }
    })
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

function $isAtNodeEdge(point, atStart = null) {
  if (atStart === null) {
    return $isAtNodeEdge(point, true) || $isAtNodeEdge(point, false)
  } else {
    return atStart ? $isAtNodeStart(point) : $isAtNodeEnd(point)
  }
}

function $isAtNodeStart(point) {
  return point.offset === 0
}
