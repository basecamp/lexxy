import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../helpers/assertions.js"
import { mockActiveStorageUploads } from "../helpers/active_storage_mock.js"

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

  test("upload non previewable attachment", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/note.txt")

    const figure = page.locator("figure.attachment[data-content-type='text/plain']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await expect(figure.locator("img")).toHaveCount(0)
    await expect(figure.locator(".attachment__name")).toHaveText("note.txt")
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
