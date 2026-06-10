import { ActionTextAttachmentUploadNode } from "./action_text_attachment_upload_node"

// Upload node for bridge-managed uploads, where the host app (iOS/Android
// WebView, etc.) picks the file, uploads it, and materializes the attachment
// via the native adapter. Lexxy receives only a placeholder File with no
// image bytes, so it can't render a local preview or run a DirectUpload.
export class ManagedAttachmentUploadNode extends ActionTextAttachmentUploadNode {
  static getType() {
    return "action_text_attachment_managed_upload"
  }

  static clone(node) {
    return new ManagedAttachmentUploadNode({ ...node }, node.__key)
  }

  static importJSON(serializedNode) {
    return new ManagedAttachmentUploadNode({ ...serializedNode })
  }

  get canPreviewFileLocally() {
    return false
  }

  $startUploadIfNeeded() {}

  $buildPreviewSrcForBlob(_blob) {
    return null
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: ManagedAttachmentUploadNode.getType()
    }
  }
}

export function $createManagedAttachmentUploadNode(...args) {
  return new ManagedAttachmentUploadNode(...args)
}
