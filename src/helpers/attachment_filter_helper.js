import { $descendantsMatching } from "@lexical/utils"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import { ActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node"

export function filterDisallowedAttachmentNodes(nodes, editorElement) {
  return nodes
    .filter(node => !isDisallowedAttachment(node, editorElement))
    .map(node => {
      $descendantsMatching([ node ], descendant => isDisallowedAttachment(descendant, editorElement))
        .forEach(descendant => descendant.remove())
      return node
    })
}

function isDisallowedAttachment(node, editorElement) {
  if (isAttachmentNode(node)) {
    return !editorElement.permitsAttachmentContentType(node.contentType) ||
           (isRemoteImage(node) && !editorElement.supportsRemoteImages)
  } else {
    return false
  }
}

function isAttachmentNode(node) {
  return node instanceof CustomActionTextAttachmentNode || node instanceof ActionTextAttachmentNode
}

// An image with no sgid is not backed by an Active Storage blob: it is hotlinked from its URL,
// as with an <img> pasted from a web page.
function isRemoteImage(node) {
  return node instanceof ActionTextAttachmentNode &&
         !(node instanceof ActionTextAttachmentUploadNode) &&
         !node.sgid &&
         /^image(\/|$)/.test(node.contentType)
}
