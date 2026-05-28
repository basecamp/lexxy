import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Preview status URL polling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("without preview_status_url: renders preview URL directly, no polling", async ({ page, editor }) => {
    const calls = await mockActiveStorageUploads(page) // no includePreviewStatusUrl

    await editor.uploadFile("test/fixtures/files/dummy.pdf", { via: "file" })

    const figure = page.locator("figure.attachment[data-content-type='application/pdf']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    // Skips the pending-preview file-icon dance; goes straight to a preview <img>.
    await expect(figure.locator("img")).toHaveAttribute(
      "src",
      /\/rails\/active_storage\/blobs\/mock-signed-id-\d+\/previews\/full$/,
      { timeout: 5_000 }
    )

    // Confirm no polling happened.
    expect(calls.previewStatusRequests).toHaveLength(0)
  })

  test("with preview_status_url: shows file icon, polls status URL, swaps to preview when ready", async ({ page, editor }) => {
    const calls = await mockActiveStorageUploads(page, { includePreviewStatusUrl: true })

    await editor.uploadFile("test/fixtures/files/dummy.pdf", { via: "file" })

    const figure = page.locator("figure.attachment[data-content-type='application/pdf']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    // While processing: file icon, not a preview image.
    await expect(figure).toHaveClass(/attachment--file/)
    await expect(figure.locator(".attachment__icon")).toBeVisible()
    await expect(figure.locator(".attachment__container img")).toHaveCount(0)

    // Wait until Lexxy has issued at least one poll, then mark the preview ready.
    await expect.poll(() => calls.previewStatusRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    calls.markPreviewReady()

    // Swaps to the preview image. The src is the preview URL exactly as
    // returned by the upload response — no cache-busting.
    const img = figure.locator(".attachment__container img")
    await expect(img).toBeVisible({ timeout: 20_000 })
    await expect(img).toHaveAttribute(
      "src",
      /\/rails\/active_storage\/blobs\/mock-signed-id-\d+\/previews\/full$/
    )
    expect(await img.getAttribute("src")).not.toMatch(/[?&]_=/)
  })
})
