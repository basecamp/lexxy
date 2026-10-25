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

  test("an attachment removed while its blob is being created is restored by undo as uploaded", async ({ page, editor }) => {
    const calls = await mockActiveStorageUploads(page, { delayDirectUploadResponse: true })
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await figure.locator("img").click()
    await editor.send("Delete")
    await expect(figure).toHaveCount(0)

    const fileStored = page.waitForResponse((response) =>
      response.url().includes("/rails/active_storage/disk/") && response.request().method() === "PUT",
    )
    await calls.releaseDirectUploadResponses()
    await fileStored
    await editor.flush()

    await page.getByRole("button", { name: "Undo" }).click()

    await expect(figure.locator("img")).toHaveAttribute("src", /\/rails\/active_storage\/blobs\//, { timeout: 10_000 })
    await expect(figure.locator("progress")).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
