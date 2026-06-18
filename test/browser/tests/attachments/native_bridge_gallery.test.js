import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Native clients (iOS/Android) hand the whole selected batch to the editor at once via
// `contents.insertPendingAttachments`, which routes through the same Uploader/GalleryUploader
// path the web uses. The nodes carry no uploadUrl — the host app owns the upload and drives
// each returned handle (setUploadProgress / setAttributes / remove) as it settles.
//
// These cover what's specific to the batch entry point: grouping multiple images into one
// gallery, a handle per file with materialize keeping the gallery, and short-circuiting an
// empty batch. General gallery behavior lives in the gallery suite.
test.describe("Native bridge gallery (batch)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("inserts multiple images as a single gallery", async ({ page, editor }) => {
    await insertPendingBatch(editor, [ image("a.png"), image("b.png") ])
    await editor.flush()

    await expect(page.locator(".attachment-gallery")).toHaveCount(1)
    await expect(page.locator(".attachment-gallery figure.attachment")).toHaveCount(2)
  })

  test("returns a handle per file and materializing keeps the gallery", async ({ page, editor }) => {
    const count = await insertPendingBatch(editor, [ image("a.png"), image("b.png") ])
    expect(count).toBe(2)
    await editor.flush()

    await materializePending(editor, 0, blobFor("a.png"))
    await materializePending(editor, 1, blobFor("b.png"))
    await editor.flush()

    await expect(page.locator(".attachment-gallery")).toHaveCount(1)
    await expect(page.locator(".attachment-gallery figure.attachment")).toHaveCount(2)
  })

  test("an empty batch inserts nothing even with the selection on an image", async ({ page, editor }) => {
    await insertPendingBatch(editor, [ image("a.png") ])
    await editor.flush()
    await expect(page.locator("figure.attachment")).toHaveCount(1)

    const count = await insertPendingBatch(editor, [])
    await editor.flush()

    expect(count).toBe(0)
    await expect(page.locator(".attachment-gallery")).toHaveCount(0)
    await expect(page.locator("figure.attachment")).toHaveCount(1)
  })
})

function image(name) {
  return { name, type: "image/png" }
}

function blobFor(name) {
  return {
    attachable_sgid: `sgid-${name}`,
    signed_id: `signed-${name}`,
    filename: name,
    content_type: "image/png",
    byte_size: 10,
    previewable: true,
    url: `/blobs/${name}`,
  }
}

async function insertPendingBatch(editor, files) {
  return editor.locator.evaluate((el, files) => {
    const fileObjects = files.map(({ name, type }) => {
      const file = new File([ "" ], name, { type })
      Object.defineProperty(file, "size", { value: 10 })
      return file
    })
    window.__pendingAttachments = el.contents.insertPendingAttachments(fileObjects)
    return window.__pendingAttachments.length
  }, files)
}

async function materializePending(editor, index, blob) {
  await editor.locator.evaluate((el, { index, blob }) => {
    window.__pendingAttachments[index].setAttributes(blob)
  }, { index, blob })
}
