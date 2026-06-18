import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Aborting an in-flight upload when its attachment is removed", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("trashing an uploading attachment aborts the upload connection", async ({ page, editor }) => {
    await mockActiveStorageUploads(page, { holdFileUploads: true })

    const diskUploadStarted = page.waitForRequest((request) =>
      request.url().includes("/rails/active_storage/disk/") && request.method() === "PUT",
    )

    const abortedRequests = []
    page.on("requestfailed", (request) => {
      if (request.url().includes("/rails/active_storage/disk/")) {
        abortedRequests.push(request)
      }
    })

    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment")
    await expect(figure).toBeVisible({ timeout: 10_000 })
    await expect(figure.locator("progress")).toBeVisible()

    await diskUploadStarted

    await figure.locator("img").click()
    await editor.send("Delete")
    await expect(figure).toHaveCount(0)

    await expect.poll(() => abortedRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)
  })
})
