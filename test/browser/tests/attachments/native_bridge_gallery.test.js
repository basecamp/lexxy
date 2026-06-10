import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Native clients (iOS/Android) hand the whole selected batch to the editor at once via
// `contents.insertPendingAttachments`, which routes through the same Uploader/GalleryUploader
// path the web uses. The nodes carry no uploadUrl — the host app owns the upload and drives
// each returned handle (setUploadProgress / setAttributes / remove) as it settles.
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

  test("inserts three images as a single gallery", async ({ page, editor }) => {
    await insertPendingBatch(editor, [ image("a.png"), image("b.png"), image("c.png") ])
    await editor.flush()

    await expect(page.locator(".attachment-gallery")).toHaveCount(1)
    await expect(page.locator(".attachment-gallery figure.attachment")).toHaveCount(3)
  })

  test("a single image is not wrapped in a gallery", async ({ page, editor }) => {
    await insertPendingBatch(editor, [ image("a.png") ])
    await editor.flush()

    await expect(page.locator(".attachment-gallery")).toHaveCount(0)
    await expect(page.locator("figure.attachment")).toHaveCount(1)
  })

  test("images group while a non-image file is placed after the gallery", async ({ page, editor }) => {
    await insertPendingBatch(editor, [ image("a.png"), image("b.png"), { name: "doc.pdf", type: "application/pdf" } ])
    await editor.flush()

    await expect(page.locator(".attachment-gallery")).toHaveCount(1)
    await expect(page.locator(".attachment-gallery figure.attachment")).toHaveCount(2)
    await expect(page.locator("figure.attachment[data-content-type='application/pdf']")).toHaveCount(1)
    await expect(page.locator(".attachment-gallery figure.attachment[data-content-type='application/pdf']")).toHaveCount(0)
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

  test("removing one image via its handle dissolves the gallery", async ({ page, editor }) => {
    await insertPendingBatch(editor, [ image("a.png"), image("b.png") ])
    await editor.flush()
    await expect(page.locator(".attachment-gallery")).toHaveCount(1)

    await removePending(editor, 0)
    await editor.flush()

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

async function removePending(editor, index) {
  await editor.locator.evaluate((el, index) => {
    window.__pendingAttachments[index].remove()
  }, index)
}
