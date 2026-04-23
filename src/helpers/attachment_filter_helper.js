import { $generateNodesFromDOM } from "@lexical/html"
import { $descendantsMatching } from "@lexical/utils"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import { ActionTextAttachmentNode } from "../nodes/action_text_attachment_node"

export function $generateFilteredNodesFromDOM(editor, doc, editorElement) {
  const nodes = $generateNodesFromDOM(editor, doc)
  return filterDisallowedAttachmentNodes(nodes, editorElement)
}

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
  const isAttachmentNode =
    node instanceof CustomActionTextAttachmentNode ||
    node instanceof ActionTextAttachmentNode
  return isAttachmentNode &&
         !editorElement.permitsAttachmentContentType(node.contentType)
}
