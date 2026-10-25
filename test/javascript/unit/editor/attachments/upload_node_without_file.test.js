import { afterEach, describe, expect, test } from "vitest"
import { $getNodeByKey, $getRoot } from "lexical"
import { createTestEditor, destroyTestEditor, tick } from "../../helpers/editor_helper"
import { ActionTextAttachmentUploadNode } from "src/nodes/action_text_attachment_upload_node"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

function insertUploadNodeWithoutFile(editorElement) {
  let key
  editorElement.editor.update(() => {
    const node = new ActionTextAttachmentUploadNode({ uploadUrl: "/direct_uploads", fileName: "photo.png", contentType: "image/png" })
    $getRoot().append(node)
    key = node.getKey()
  }, { discrete: true })
  return key
}

// importJSON and collaboration can materialize an upload node without its
// local File; rendering one must not start an upload or read the missing file.
describe("upload node without a file", () => {
  test("renders the file icon and doesn't start an upload", async () => {
    editorElement = await createTestEditor()

    const key = insertUploadNodeWithoutFile(editorElement)
    await tick()

    expect(editorElement.querySelector("figure .attachment__icon")).not.toBeNull()
    expect(editorElement.querySelector("figure img")).toBeNull()
    expect(editorElement.editor.getEditorState().read(() => $getNodeByKey(key).progress)).toBeNull()
  })
})
