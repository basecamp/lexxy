import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

// An in-flight direct upload can outlive the editor: teardown runs on
// disconnect and on every turbo:before-cache, but the upload's ActiveStorage
// callbacks still fire afterwards — #forgetUploadRequest when the store PUT
// completes, #rememberUploadRequest when blob creation resolves — and both
// dereference #editorElement on a torn-down editor.
// Sentry: BC3-JS-N8HN, BC3-JS-N8HP.
test.describe("Upload outliving editor teardown", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  const isDiskUpload = (request) =>
    request.url().includes("/rails/active_storage/disk/") && request.method() === "PUT"

  // The upload callbacks run in XHR event handlers after the network event, so
  // give the page one macrotask turn before asserting no errors surfaced.
  const settle = (page) => page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)))

  test("file upload completing after teardown does not throw (forget path)", async ({ page, editor }) => {
    await mockActiveStorageUploads(page, { uploadDelayMs: 1000 })

    const pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error))

    const diskUploadStarted = page.waitForRequest(isDiskUpload)

    await editor.uploadFile("test/fixtures/files/example.png")
    await diskUploadStarted

    const diskUploadFinished = page.waitForEvent("requestfinished", isDiskUpload)
    await page.evaluate(() => document.querySelector("lexxy-editor").remove())
    await diskUploadFinished

    await settle(page)
    expect(pageErrors.map(String)).toEqual([])
  })

  test("blob creation resolving after teardown does not throw (remember path)", async ({ page, editor }) => {
    const calls = await mockActiveStorageUploads(page, { delayDirectUploadResponse: true })

    const pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error))

    await editor.uploadFile("test/fixtures/files/example.png")
    await expect.poll(() => calls.blobCreations.length).toBeGreaterThan(0)

    await page.evaluate(() => document.querySelector("lexxy-editor").remove())

    const diskUploadFinished = page.waitForEvent("requestfinished", isDiskUpload)
    await calls.releaseDirectUploadResponses()
    await diskUploadFinished

    await settle(page)
    expect(pageErrors.map(String)).toEqual([])
  })
})
