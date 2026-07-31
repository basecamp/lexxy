import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor } from "../../helpers/editor_helper"
import { ActionTextAttachmentNode } from "src/nodes/action_text_attachment_node"
import { ActionTextAttachmentUploadNode } from "src/nodes/action_text_attachment_upload_node"
import { CustomActionTextAttachmentNode } from "src/nodes/custom_action_text_attachment_node"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

function constructWithNoArguments(editorElement, nodeClass) {
  editorElement.editor.update(() => {
    new nodeClass() // eslint-disable-line no-new
  }, { discrete: true })
}

// @lexical/yjs constructs registered node classes with no arguments (at bind
// time and when materializing remote updates), so these must not throw.
describe("attachment node construction", () => {
  test("constructs every attachment node with no arguments", async () => {
    editorElement = await createTestEditor()

    expect(() => constructWithNoArguments(editorElement, ActionTextAttachmentNode)).not.toThrow()
    expect(() => constructWithNoArguments(editorElement, ActionTextAttachmentUploadNode)).not.toThrow()
    expect(() => constructWithNoArguments(editorElement, CustomActionTextAttachmentNode)).not.toThrow()
  })
})
