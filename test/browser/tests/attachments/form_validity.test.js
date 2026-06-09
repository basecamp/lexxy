import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Form validity during uploads", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("editor is invalid while an upload is in flight and valid after it completes", async ({ page, editor }) => {
    const calls = await mockActiveStorageUploads(page, { delayDirectUploadResponse: true })

    await editor.send("Hello")
    await expect.poll(() => editor.locator.evaluate((el) => el.checkValidity())).toBe(true)

    await editor.uploadFile("test/fixtures/files/example.png")
    await expect(page.locator("figure.attachment progress")).toBeVisible({ timeout: 10_000 })

    await expect.poll(() => editor.locator.evaluate((el) => el.checkValidity())).toBe(false)
    expect(await editor.locator.evaluate((el) => el.internals.validationMessage)).toBe(
      "Please wait for all files to upload",
    )

    await calls.releaseDirectUploadResponses()
    await expect(page.locator("figure.attachment img")).toHaveAttribute(
      "src",
      /\/rails\/active_storage\/blobs\//,
      { timeout: 10_000 },
    )

    await expect.poll(() => editor.locator.evaluate((el) => el.checkValidity())).toBe(true)
  })

  test("uses a custom uploads-busy-message when configured", async ({ page, editor }) => {
    await page.goto("/attachments-uploads-busy-message.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")

    const calls = await mockActiveStorageUploads(page, { delayDirectUploadResponse: true })

    await editor.send("Hello")
    await editor.uploadFile("test/fixtures/files/example.png")
    await expect(page.locator("figure.attachment progress")).toBeVisible({ timeout: 10_000 })

    await expect.poll(() => editor.locator.evaluate((el) => el.checkValidity())).toBe(false)
    expect(await editor.locator.evaluate((el) => el.internals.validationMessage)).toBe(
      "Počkejte prosím na dokončení nahrávání souborů.",
    )

    await calls.releaseDirectUploadResponses()
  })
})
