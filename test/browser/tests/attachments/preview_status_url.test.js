import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Deferred preview rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test.describe("without preview_status_url", () => {
    test("shows file icon initially, preloads preview, swaps when it loads", async ({ page, editor }) => {
      // delayBlobResponses holds the preview URL request so the preload
      // can't complete before we assert the file-icon state.
      const calls = await mockActiveStorageUploads(page, { delayBlobResponses: true })

      await editor.uploadFile("test/fixtures/files/dummy.pdf", { via: "file" })

      const figure = page.locator("figure.attachment[data-content-type='application/pdf']")
      await expect(figure).toBeVisible({ timeout: 10_000 })

      // Initial state: file icon, no preview image yet.
      await expect(figure).toHaveClass(/attachment--file/)
      await expect(figure.locator(".attachment__icon")).toBeVisible()
      await expect(figure.locator(".attachment__container img")).toHaveCount(0)

      // No status URL polling happens — this path doesn't use it.
      expect(calls.previewStatusRequests).toHaveLength(0)

      // Release the preview URL response. The preload Image() finishes
      // loading and Lexxy swaps the figure to show the preview img.
      await calls.releaseBlobResponses()

      const img = figure.locator(".attachment__container img")
      await expect(img).toBeVisible({ timeout: 10_000 })
      await expect(img).toHaveAttribute(
        "src",
        /\/rails\/active_storage\/blobs\/mock-signed-id-\d+\/previews\/full$/
      )

      // No cache-busting query string on the rendered preview.
      expect(await img.getAttribute("src")).not.toMatch(/[?&]_=/)
    })

    test("keeps file icon when the preview image fails to load", async ({ page, editor }) => {
      // delayBlobResponses + failBlobResponses: hold preview URL requests
      // and return a non-OK status when released. The preload Image() errors,
      // so no swap happens and the file icon stays.
      const calls = await mockActiveStorageUploads(page, { delayBlobResponses: true, failBlobResponses: true })

      await editor.uploadFile("test/fixtures/files/dummy.pdf", { via: "file" })

      const figure = page.locator("figure.attachment[data-content-type='application/pdf']")
      await expect(figure).toBeVisible({ timeout: 10_000 })

      await expect(figure).toHaveClass(/attachment--file/)
      await expect(figure.locator(".attachment__icon")).toBeVisible()

      // Release the preview URL — server returns an error.
      await calls.releaseBlobResponses()

      // Give the image's onerror a chance to fire — but the figure stays
      // on the file-icon variant: no preview img is ever inserted.
      await expect(figure.locator(".attachment__container img")).toHaveCount(0, { timeout: 3_000 })
      await expect(figure).toHaveClass(/attachment--file/)
      await expect(figure.locator(".attachment__icon")).toBeVisible()

      expect(calls.previewStatusRequests).toHaveLength(0)
    })
  })

  test.describe("with preview_status_url", () => {
    test("shows file icon, polls status URL, swaps to preview when ready", async ({ page, editor }) => {
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
      await expect(img).toBeVisible({ timeout: 30_000 })
      await expect(img).toHaveAttribute(
        "src",
        /\/rails\/active_storage\/blobs\/mock-signed-id-\d+\/previews\/full$/
      )
      expect(await img.getAttribute("src")).not.toMatch(/[?&]_=/)
    })

    test("treats a 3xx redirect as ready instead of following it", async ({ page, editor, browserName }) => {
      // Playwright's WebKit driver refuses route.fulfill with a 3xx status,
      // so we can't synthesize the redirect we want to assert against.
      // Chromium and Firefox cover this case.
      test.skip(browserName === "webkit", "WebKit Playwright cannot fulfill with 3xx status")

      // `previewReadyStatus: 302` makes the mock respond with a redirect
      // once we mark the preview ready. Without `redirect: "manual"` on the
      // status fetch, the browser would silently follow the Location and
      // resolve to a 200 — looking like "still processing" — and Lexxy
      // would never swap to the preview.
      const calls = await mockActiveStorageUploads(page, {
        includePreviewStatusUrl: true,
        previewReadyStatus: 302
      })

      await editor.uploadFile("test/fixtures/files/dummy.pdf", { via: "file" })

      const figure = page.locator("figure.attachment[data-content-type='application/pdf']")
      await expect(figure).toBeVisible({ timeout: 10_000 })

      await expect.poll(() => calls.previewStatusRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)
      calls.markPreviewReady()

      const img = figure.locator(".attachment__container img")
      await expect(img).toBeVisible({ timeout: 30_000 })
    })

    test("polls multiple times and hits the preview URL exactly once, without cache-busting", async ({ page, editor }) => {
      const calls = await mockActiveStorageUploads(page, { includePreviewStatusUrl: true })

      await editor.uploadFile("test/fixtures/files/dummy.pdf", { via: "file" })

      const figure = page.locator("figure.attachment[data-content-type='application/pdf']")
      await expect(figure).toBeVisible({ timeout: 10_000 })

      // Wait for at least two polls — confirms the polling loop is running.
      await expect.poll(() => calls.previewStatusRequests.length, { timeout: 20_000 }).toBeGreaterThanOrEqual(2)

      // No preview URL fetches during the polling window — this is the
      // whole point of polling a status URL instead of the preview URL.
      expect(calls.previewUrlRequests).toHaveLength(0)

      calls.markPreviewReady()

      const img = figure.locator(".attachment__container img")
      await expect(img).toBeVisible({ timeout: 30_000 })

      // Preview URL was hit exactly once, after status flipped — no
      // cache-busted polls against the preview origin.
      expect(calls.previewUrlRequests).toHaveLength(1)
      expect(calls.previewUrlRequests[0]).not.toMatch(/[?&]_=/)
    })
  })
})
