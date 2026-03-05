import * as Lexxy from "@37signals/lexxy"

class DemoAttachmentUploadNode extends Lexxy.ActionTextAttachmentUploadNode {
  $config() {
    return this.config("demo_attachment_upload", {
      extends: Lexxy.ActionTextAttachmentUploadNode,
      replace: {
        node: Lexxy.ActionTextAttachmentUploadNode,
        with: (node) => new DemoAttachmentUploadNode({ ...node })
      }
    })
  }

  constructor(node, key) {
    super({ ...node, progress: 100 }, key)
  }
}

export class DemoExtension extends Lexxy.Extension {
  get lexicalExtension() {
    return {
      name: "lexxy/demo-attachments",
      nodes: [
        DemoAttachmentUploadNode,
        {
          replace: Lexxy.ActionTextAttachmentUploadNode,
          with: node => new DemoAttachmentUploadNode(node),
          withKlass: DemoAttachmentUploadNode
        }
      ],
    }
  }
}
