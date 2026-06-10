import { afterEach, describe, expect, test } from "vitest"
import { $getNodeByKey, $getRoot } from "lexical"
import { createTestEditor, destroyTestEditor, setContent, selectEnd, tick } from "../unit/helpers/editor_helper"
import { ManagedAttachmentUploadNode } from "../../../src/nodes/managed_attachment_upload_node"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

function createFile(name = "test.png", type = "image/png") {
  return new File(["test"], name, { type })
}

function findMaterializedAttachmentNode() {
  let found = null
  const visit = (node) => {
    if (node.getType?.() === "action_text_attachment") found = node
    node.getChildren?.().forEach(visit)
  }
  $getRoot().getChildren().forEach(visit)
  return found
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

  test("inserts a ManagedAttachmentUploadNode for bridge-managed uploads", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello</p>")
    selectEnd(editorElement)

    editorElement.contents.insertPendingAttachment(createFile())

    let nodeType = null
    editorElement.editor.read(() => {
      const visit = (node) => {
        if (node instanceof ManagedAttachmentUploadNode) nodeType = node.getType()
        node.getChildren?.().forEach(visit)
      }
      $getRoot().getChildren().forEach(visit)
    })

    expect(nodeType).toBe(ManagedAttachmentUploadNode.getType())
  })

  test("managed upload node renders a file figure even for previewable images", async () => {
    editorElement = await createTestEditor()

    let figure = null
    editorElement.editor.update(() => {
      const uploadNode = new ManagedAttachmentUploadNode({
        file: createFile("photo.png", "image/png"),
        blobUrlTemplate: null,
      })
      figure = uploadNode.createDOM({ theme: {} })
    })

    // Bridge uploads have no real image bytes, so the upload UI is always
    // a file icon with a progress bar — never a local image preview.
    expect(figure.tagName).toBe("FIGURE")
    expect(figure.classList.contains("attachment--file")).toBe(true)
    expect(figure.classList.contains("attachment--preview")).toBe(false)
    expect(figure.querySelector("img")).toBeNull()
    expect(figure.querySelector("progress")).not.toBeNull()
  })

  test("managed upload node progress can be updated on writable node", async () => {
    editorElement = await createTestEditor()

    let progress = null
    editorElement.editor.update(() => {
      const uploadNode = new ManagedAttachmentUploadNode({
        file: createFile(),
        blobUrlTemplate: null,
      })
      $getRoot().append(uploadNode)

      const writable = uploadNode.getWritable()
      writable.progress = 75
      progress = writable.progress
    })

    expect(progress).toBe(75)
  })

  test("managed upload node does not start a DirectUpload", async () => {
    editorElement = await createTestEditor()

    let progressBefore, progressAfter
    editorElement.editor.update(() => {
      const uploadNode = new ManagedAttachmentUploadNode({
        file: createFile(),
        blobUrlTemplate: null,
      })
      $getRoot().append(uploadNode)
      progressBefore = uploadNode.progress
      uploadNode.createDOM({ theme: {} })
      const refreshed = $getNodeByKey(uploadNode.getKey())
      progressAfter = refreshed.progress
    })

    // Local DirectUpload bumps progress to 1 when it starts; the bridge
    // path must not, since the host app owns the upload.
    expect(progressBefore).toBeNull()
    expect(progressAfter).toBeNull()
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

  test("handle can still remove attachment after setAttributes replaces upload node", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello</p>")
    selectEnd(editorElement)

    const handle = editorElement.contents.insertPendingAttachment(createFile())
    expect(handle).not.toBeNull()

    handle.setAttributes({
      attachable_sgid: "sgid://app/ActiveStorage::Blob/1",
      filename: "test.png",
      content_type: "image/png",
      byte_size: 4,
      previewable: true,
      url: "https://example.com/test.png",
      signed_id: "signed-id"
    })
    await tick()

    expect(editorElement.value).toContain("action-text-attachment")

    handle.remove()
    await tick()

    expect(editorElement.value).not.toContain("action-text-attachment")
  })

  test("bridge-materialized image points at the server url, not a local blob preview", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello</p>")
    selectEnd(editorElement)

    const handle = editorElement.contents.insertPendingAttachment(createFile("photo.png", "image/png"))
    handle.setAttributes({
      attachable_sgid: "sgid://app/ActiveStorage::Blob/1",
      filename: "photo.png",
      content_type: "image/png",
      byte_size: 4,
      previewable: true,
      url: "https://example.com/photo.png",
      signed_id: "signed-id"
    })
    await tick()

    let previewSrc, src
    editorElement.editor.read(() => {
      const node = findMaterializedAttachmentNode()
      previewSrc = node?.previewSrc
      src = node?.src
    })

    // Bridge uploads hand Lexxy a placeholder File with no real image bytes,
    // so a blob: previewSrc would render as a broken image until it's swapped.
    expect(previewSrc ?? null).toBeNull()
    expect(src).toBe("https://example.com/photo.png")
  })
})
