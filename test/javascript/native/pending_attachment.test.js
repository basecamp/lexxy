import { afterEach, describe, expect, test } from "vitest"
import { $getRoot } from "lexical"
import { createTestEditor, destroyTestEditor, setContent, selectEnd } from "../helpers/editor_helper"
import { ActionTextAttachmentUploadNode } from "../../../src/nodes/action_text_attachment_upload_node"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

function createFile(name = "test.png", type = "image/png") {
  return new File(["test"], name, { type })
}

describe("insertPendingAttachment", () => {
  test("returns a handle with setAttributes, setUploadProgress, and remove methods", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello</p>")
    selectEnd(editorElement)

    const handle = editorElement.contents.insertPendingAttachment(createFile())

    expect(handle).not.toBeNull()
    expect(typeof handle.setAttributes).toBe("function")
    expect(typeof handle.setUploadProgress).toBe("function")
    expect(typeof handle.remove).toBe("function")
  })

  test("creates upload node with null uploadUrl for bridge-managed uploads", async () => {
    editorElement = await createTestEditor()

    let uploadUrl = "not-null"
    editorElement.editor.update(() => {
      const uploadNode = new ActionTextAttachmentUploadNode({
        file: createFile(),
        uploadUrl: null,
        blobUrlTemplate: null,
      })
      uploadUrl = uploadNode.uploadUrl
    })

    expect(uploadUrl).toBeNull()
  })

  test("upload node createDOM produces a valid figure element", async () => {
    editorElement = await createTestEditor()

    let figure = null
    editorElement.editor.update(() => {
      const uploadNode = new ActionTextAttachmentUploadNode({
        file: createFile("document.pdf", "application/pdf"),
        uploadUrl: null,
        blobUrlTemplate: null,
      })
      figure = uploadNode.createDOM({ theme: {} })
    })

    expect(figure.tagName).toBe("FIGURE")
    expect(figure.classList.contains("attachment")).toBe(true)
    expect(figure.classList.contains("attachment--file")).toBe(true)
    expect(figure.querySelector("progress")).not.toBeNull()
    expect(figure.querySelector(".attachment__name").textContent).toBe("document.pdf")
  })

  test("upload node progress can be updated on writable node", async () => {
    editorElement = await createTestEditor()

    let progress = null
    editorElement.editor.update(() => {
      const uploadNode = new ActionTextAttachmentUploadNode({
        file: createFile(),
        uploadUrl: null,
        blobUrlTemplate: null,
      })
      $getRoot().append(uploadNode)

      const writable = uploadNode.getWritable()
      writable.progress = 75
      progress = writable.progress
    })

    expect(progress).toBe(75)
  })

  test("returns null when attachments are not supported", async () => {
    editorElement = await createTestEditor()

    // Override supportsAttachments to return false
    Object.defineProperty(editorElement, "supportsAttachments", {
      get: () => false,
      configurable: true
    })

    const handle = editorElement.contents.insertPendingAttachment(createFile())
    expect(handle).toBeNull()
  })
})
