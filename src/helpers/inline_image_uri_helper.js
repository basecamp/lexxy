import { $descendantsMatching } from "@lexical/utils"
import { ActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { $createActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node"
import { mimeTypeToExtension } from "./storage_helper"

// Replaces inline `data:image/...` attachments with upload nodes that flow through the normal
// file upload pipeline.
//
// Without this step, pasted-from-Google-Docs-style content lands in the editor with the entire
// base64 image embedded in the attachment's `src`, which then persists into the saved HTML and
// bloats the stored document.
//
// Each conversion dispatches the cancelable `lexxy:file-accept` event so the host's allowlist (and
// any other listener) can refuse the synthesized File before it's accepted into the upload
// pipeline; on refusal, the node is dropped silently — matching how `Contents#uploadFiles` handles
// file-picker rejections.
export function $convertInlineImageDataURIs(nodes, editorElement) {
  const topLevel = nodes
    .map(node => isInlineImageDataURIAttachment(node) ? $tryCreateUploadFromDataURI(node, editorElement) : node)
    .filter(node => node !== null)

  for (const node of topLevel) {
    for (const desc of $descendantsMatching([ node ], isInlineImageDataURIAttachment)) {
      const upload = $tryCreateUploadFromDataURI(desc, editorElement)
      if (upload) {
        desc.replace(upload)
      } else {
        desc.remove()
      }
    }
  }

  return topLevel
}

function isInlineImageDataURIAttachment(node) {
  return node instanceof ActionTextAttachmentNode &&
    /^data:image\//i.test(node.src ?? "")
}

function $tryCreateUploadFromDataURI(node, editorElement) {
  const file = dataURIToFile(node.src)
  if (file && editorElement.acceptsFile(file)) {
    return $createActionTextAttachmentUploadNode({
      file,
      uploadUrl: editorElement.directUploadUrl,
      blobUrlTemplate: editorElement.blobUrlTemplate,
      contentType: file.type,
    })
  }
  return null
}

function dataURIToFile(dataURI) {
  try {
    const [ header, data ] = dataURI.split(",")

    // https://datatracker.ietf.org/doc/html/rfc6838#section-4.2
    const mimeType = header.match(/^data:(image\/[A-Za-z0-9][A-Za-z0-9!#$&\-^_.+]*)/)?.[1]
    if (mimeType) {
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
      const extension = mimeTypeToExtension(mimeType) ?? "png"
      return new File([ bytes ], `pasted-image-${Date.now()}.${extension}`, { type: mimeType })
    } else {
      return null
    }
  } catch {
    return null
  }
}
