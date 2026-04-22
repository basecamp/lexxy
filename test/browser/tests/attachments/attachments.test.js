import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Attachments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("upload image", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await expect(figure.locator("img")).toHaveAttribute(
      "src",
      /\/rails\/active_storage\/blobs\/mock-signed-id-\d+\/example\.png/,
    )
    await expect(figure.locator("figcaption textarea")).toHaveAttribute(
      "placeholder",
      "example.png",
    )

    await expect(page.locator("[data-event='lexxy:upload-start']")).toHaveCount(1)
    await expect(page.locator("[data-event='lexxy:upload-end']")).toHaveCount(1)
  })

  test("image keeps local preview until server image loads", async ({ page, editor }) => {
    const calls = await mockActiveStorageUploads(page, { delayBlobResponses: true })
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    const img = figure.locator("img")

    // While the server image is delayed, the img should show a local blob: preview
    await expect(img).toHaveAttribute("src", /^blob:/)

    // Release the server image response and verify it swaps
    await calls.releaseBlobResponses()

    await expect(img).toHaveAttribute(
      "src",
      /\/rails\/active_storage\/blobs\/mock-signed-id-\d+\/example\.png/,
    )
  })

  test("deleting attachment before server image loads does not crash", async ({ page, editor }) => {
    const calls = await mockActiveStorageUploads(page, { delayBlobResponses: true })
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    // Delete the attachment while the server image is still pending
    await figure.locator("img").click()
    await editor.send("Delete")
    await expect(figure).toHaveCount(0)

    // Release the blob response — should not throw on the now-removed node
    await calls.releaseBlobResponses()

    // Editor should be empty and functional
    await assertEditorHtml(editor, "")
    await editor.send("Still works")
    await expect(editor.content).toContainText("Still works")
  })

  test("upload non previewable attachment", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/note.txt", { via: "file" })

    const figure = page.locator("figure.attachment[data-content-type='text/plain']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await expect(figure.locator("img")).toHaveCount(0)
    await expect(figure.locator(".attachment__name")).toHaveText("note.txt")
  })

  test("upload previewable PDF shows file icon initially while preview loads", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/dummy.pdf", { via: "file" })

    const figure = page.locator("figure.attachment[data-content-type='application/pdf']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    // Should show as file attachment initially (not a giant placeholder image)
    await expect(figure).toHaveClass(/attachment--file/)
    await expect(figure.locator("img")).toHaveCount(0)
    await expect(figure.locator(".attachment__icon")).toBeVisible()
    await expect(figure.locator(".attachment__name")).toHaveText("dummy.pdf")
  })

  test("delete attachment with keyboard", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await figure.locator("img").click()
    await editor.send("Delete")

    await expect(figure).toHaveCount(0)
    await assertEditorHtml(editor, "")
  })

  test("delete attachment with delete button", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await figure.locator("img").click()
    await expect(page.locator("lexxy-node-delete-button")).toBeVisible()
    await page.locator("lexxy-node-delete-button button[aria-label='Remove']").click()

    await expect(figure).toHaveCount(0)
    await assertEditorHtml(editor, "")
  })

  test("caption syncs and editor has focus after Enter", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = page.locator("figure.attachment figcaption textarea")
    await expect(caption).toBeVisible({ timeout: 10_000 })

    await caption.click()
    await caption.pressSequentially("My caption")
    await caption.press("Enter")

    await assertEditorHasFocus(editor)
    await assertEditorValueContains(editor, 'caption="My caption"')
  })

  test("caption saves and editor has focus after click", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = page.locator("figure.attachment figcaption textarea")
    await expect(caption).toBeVisible({ timeout: 10_000 })

    await caption.click()
    await caption.pressSequentially("My caption")

    // Blur the caption first to trigger the save, then click editor content
    await caption.evaluate((el) => el.blur())
    await editor.flush()
    await editor.content.click()

    await assertEditorHasFocus(editor)
    await assertEditorValueContains(editor, 'caption="My caption"')
  })

  test("caption saves and editor has focus after Tab", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = page.locator("figure.attachment figcaption textarea")
    await expect(caption).toBeVisible({ timeout: 10_000 })

    await caption.click()
    await caption.pressSequentially("My caption")

    // Blur the caption first to trigger the save, then press Tab
    await caption.evaluate((el) => el.blur())
    await editor.flush()
    await caption.press("Tab")

    await assertEditorValueContains(editor, 'caption="My caption"')
  })

  test("Ctrl+A selects text in caption without affecting editor", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    const caption = figure.locator("figcaption textarea")
    await caption.click()
    await caption.pressSequentially("Hello world")

    const modifier = process.platform === "darwin" ? "Meta" : "Control"
    await caption.press(`${modifier}+a`)

    const selectionLength = await caption.evaluate((textarea) => {
      return textarea.selectionEnd - textarea.selectionStart
    })
    expect(selectionLength).toBe("Hello world".length)
    await expect(figure).toBeVisible()
  })

  test("Ctrl+X in caption cuts text, doesn't remove image", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    const caption = figure.locator("figcaption textarea")
    await caption.click()
    await caption.pressSequentially("Cut me")

    const modifier = process.platform === "darwin" ? "Meta" : "Control"
    await caption.press(`${modifier}+a`)
    await caption.press(`${modifier}+x`)

    await expect(caption).toHaveValue("")
    await expect(figure).toBeVisible()
  })

  test("caret position matches typing position after uploading image into empty editor", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })
    await editor.flush()

    // After uploading into an empty editor, the cursor should land below the
    // attachment so typing inserts text there. The trailing provisional paragraph
    // must be visible (not collapsed as hidden) so the caret renders correctly.
    const paragraphAfterAttachment = figure.locator("xpath=following-sibling::p[1]")
    await expect(paragraphAfterAttachment).toHaveClass(/provisional-paragraph/)
    await expect(paragraphAfterAttachment).not.toHaveClass(/hidden/)
  })

  test("typing after uploading image into empty editor inserts text below the attachment", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })
    await editor.flush()

    await page.keyboard.type("hello below")

    const paragraph = figure.locator("xpath=following-sibling::p[1]")
    await expect(paragraph).toHaveText("hello below")
  })

  test("typing during pending upload keeps caret position after completion", async ({ page, editor }) => {
    const calls = await mockActiveStorageUploads(page, { delayDirectUploadResponse: true })
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await editor.send("hello")
    await expect.poll(() => editor.plainTextValue()).toContain("hello")

    await calls.releaseDirectUploadResponses()
    await editor.flush()

    await editor.send(" world")
    await expect.poll(() => editor.plainTextValue()).toContain("hello world")
  })

  test("undo after uploading into empty editor restores empty state", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment")
    await expect(figure).toBeVisible({ timeout: 10_000 })
    await editor.flush()

    // Wait for the history collapse to complete (runs in requestAnimationFrame)
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))

    // Undo until the undo button is disabled — no stale upload node should remain
    const undoButton = page.getByRole("button", { name: "Undo" })
    while (await undoButton.evaluate((el) => !el.disabled)) {
      await undoButton.click()
      await editor.flush()
    }

    await expect(figure).toHaveCount(0)
    await expect(editor.content.locator("progress")).toHaveCount(0)
  })

  test("undo preserves edits made during upload", async ({ page, editor }) => {
    await mockActiveStorageUploads(page, { uploadDelayMs: 1_000 })

    await editor.uploadFile("test/fixtures/files/example.png")

    const uploadProgress = page.locator("figure.attachment progress")
    await expect(uploadProgress).toBeVisible({ timeout: 10_000 })

    // Type while the upload node is still in-flight.
    await editor.send("hello world")
    await expect(uploadProgress).toBeVisible()

    const figure = page.locator("figure.attachment")
    await expect(figure.locator("img")).toHaveAttribute(
      "src",
      /\/rails\/active_storage\/blobs\/mock-signed-id-\d+\/example\.png/,
      { timeout: 10_000 },
    )
    await editor.flush()

    // Wait for the history collapse to complete
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))

    // Undo should remove the typed text but preserve the attachment
    const undoButton = page.getByRole("button", { name: "Undo" })
    await undoButton.click()
    await editor.flush()

    await expect(figure).toBeVisible()
    await expect(editor.content).not.toContainText("hello world")
  })

  test("node selection does not create an extra undo step", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.send("hello")
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })
    await editor.flush()
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))

    // Click to create a node selection, then undo should still remove the attachment.
    await figure.locator("img").click()
    await editor.flush()

    await page.getByRole("button", { name: "Undo" }).click()
    await editor.flush()

    await expect(figure).toHaveCount(0)
    await expect(editor.content).toContainText("hello")
  })

  test("upload completion clears redo after undo during upload", async ({ page, editor }) => {
    await mockActiveStorageUploads(page, { uploadDelayMs: 500 })
    await editor.send("hello")
    await editor.uploadFile("test/fixtures/files/example.png")

    const undoButton = page.getByRole("button", { name: "Undo" })
    const redoButton = page.getByRole("button", { name: "Redo" })
    await expect(page.locator("figure.attachment progress")).toBeVisible({ timeout: 10_000 })

    await undoButton.click()
    await editor.flush()
    await expect(redoButton).toBeEnabled()
    await expect.poll(() => page.evaluate(() => {
      return document.querySelector("lexxy-editor").historyState.redoStack.length
    })).toBeGreaterThan(0)

    await expect.poll(() => page.evaluate(() => {
      return document.querySelector("lexxy-editor").historyState.redoStack.length
    }), { timeout: 5_000 }).toBe(0)

    // Redo should be a no-op once completion collapses and clears redo history.
    await redoButton.click()
    await editor.flush()
    await expect(page.locator("figure.attachment")).toHaveCount(0)
    await expect(editor.content).toContainText("hello")
  })

  test("Ctrl+C in caption copies text without losing focus", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    const caption = figure.locator("figcaption textarea")
    await caption.click()
    await caption.pressSequentially("Copy me")

    const modifier = process.platform === "darwin" ? "Meta" : "Control"
    await caption.press(`${modifier}+a`)
    await caption.press(`${modifier}+c`)

    const captionHasFocus = await caption.evaluate((textarea) => {
      return document.activeElement === textarea
    })
    expect(captionHasFocus).toBe(true)
    await expect(caption).toHaveValue("Copy me")
    await expect(figure).toBeVisible()
  })
})

async function assertEditorHasFocus(editor) {
  await expect.poll(() => editor.content.evaluate(
    (el) => document.activeElement === el || el.contains(document.activeElement),
  )).toBe(true)
}

async function assertEditorValueContains(editor, substring) {
  await expect.poll(async () => {
    await editor.flush()
    return await editor.value()
  }, { timeout: 5_000 }).toContain(substring)
}
