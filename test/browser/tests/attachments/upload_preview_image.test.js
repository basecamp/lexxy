import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Upload preview image", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("is not natively draggable or selectable while uploading", async ({ page, editor }) => {
    await mockActiveStorageUploads(page, { holdFileUploads: true })

    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment")
    await expect(figure.locator("progress")).toBeVisible({ timeout: 10_000 })

    // Dragging the <img> itself, or selecting it, lets Safari's Live Text
    // pick up text inside the image. The figure stays draggable as a whole.
    const image = figure.locator("img")
    await expect.poll(() => image.evaluate((img) => img.draggable)).toBe(false)
    await expect.poll(() => image.evaluate((img) => {
      const style = getComputedStyle(img)
      return style.userSelect || style.webkitUserSelect
    })).toBe("none")
  })
})
