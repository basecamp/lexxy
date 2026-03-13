import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../helpers/active_storage_mock.js"

test.describe("Bug: Keyboard shortcuts in image captions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("Ctrl+A selects text in caption without affecting editor", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    const caption = figure.locator("figcaption textarea")
    await caption.click()
    await caption.pressSequentially("Hello world")

    // Press Ctrl+A to select all text in the caption
    const modifier = process.platform === "darwin" ? "Meta" : "Control"
    await caption.press(`${modifier}+a`)

    // The caption textarea should have all its text selected
    const selectionLength = await caption.evaluate((textarea) => {
      return textarea.selectionEnd - textarea.selectionStart
    })
    expect(selectionLength).toBe("Hello world".length)

    // The image should still be present
    await expect(figure).toBeVisible()
  })

  test("Ctrl+X in caption cuts text, doesn't remove image", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    const caption = figure.locator("figcaption textarea")
    await caption.click()
    await caption.pressSequentially("Cut me")

    // Select all text in the caption, then cut
    const modifier = process.platform === "darwin" ? "Meta" : "Control"
    await caption.press(`${modifier}+a`)
    await caption.press(`${modifier}+x`)

    // The caption text should be empty (text was cut)
    await expect(caption).toHaveValue("")

    // The image must still be present (not removed by Lexical's cut command)
    await expect(figure).toBeVisible()
  })

  test("Ctrl+C in caption copies text without losing focus", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    const caption = figure.locator("figcaption textarea")
    await caption.click()
    await caption.pressSequentially("Copy me")

    // Select all text in the caption, then copy
    const modifier = process.platform === "darwin" ? "Meta" : "Control"
    await caption.press(`${modifier}+a`)
    await caption.press(`${modifier}+c`)

    // The caption should still have focus
    const captionHasFocus = await caption.evaluate((textarea) => {
      return document.activeElement === textarea
    })
    expect(captionHasFocus).toBe(true)

    // The caption text should still be there (not cleared)
    await expect(caption).toHaveValue("Copy me")

    // The image must still be present
    await expect(figure).toBeVisible()
  })
})
