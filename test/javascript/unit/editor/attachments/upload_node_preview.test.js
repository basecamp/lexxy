import { afterEach, describe, expect, test } from "vitest"
import { $getNodeByKey, $getRoot } from "lexical"
import { createTestEditor, destroyTestEditor, tick } from "../../helpers/editor_helper"
import { ActionTextAttachmentUploadNode } from "src/nodes/action_text_attachment_upload_node"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

const blob = {
  attachable_sgid: "sgid://app/ActiveStorage::Blob/1",
  filename: "photo.png",
  content_type: "image/png",
  byte_size: 4,
  previewable: true,
  url: "https://example.com/photo.png",
  signed_id: "signed-id"
}

// A regular upload has the real file, so it previews it locally while the
// server image loads. Only bridge-managed uploads skip the local preview.
describe("upload node with a local file", () => {
  test("previews the image and keeps the local preview once uploaded", async () => {
    editorElement = await createTestEditor()

    let key
    editorElement.editor.update(() => {
      // progress: 1 marks the upload as started, so no DirectUpload runs in the test.
      const node = new ActionTextAttachmentUploadNode({
        file: new File([ "test" ], "photo.png", { type: "image/png" }),
        uploadUrl: "/direct_uploads",
        blobUrlTemplate: "/blobs/:signed_id/:filename",
        progress: 1
      })
      $getRoot().append(node)
      key = node.getKey()
    }, { discrete: true })
    await tick()

    expect(editorElement.querySelector("figure img")).not.toBeNull()
    expect(editorElement.querySelector("figure progress")).not.toBeNull()

    let previewSrc, src
    editorElement.editor.update(() => {
      const attachmentKey = $getNodeByKey(key).$showUploadedAttachment(blob)
      const attachment = $getNodeByKey(attachmentKey)
      previewSrc = attachment.previewSrc
      src = attachment.src
    }, { discrete: true })

    expect(previewSrc).toMatch(/^blob:/)
    expect(src).toBe("https://example.com/photo.png")
  })
})
