import { readFileSync } from "node:fs"
import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

const EXAMPLE_PNG = readFileSync("test/fixtures/files/example.png").toString("base64")

test.describe("Paste — Remote images", () => {
  test("pasted remote images are kept by default", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()

    await editor.paste("", { html: `<p>Look</p><img src="https://example.com/photo.jpg">` })

    await expect(editor.content.locator("figure.attachment img[src='https://example.com/photo.jpg']")).toHaveCount(1)
  })

  test("pasted remote images are dropped when remote images are disabled", async ({ page, editor }) => {
    await page.goto("/remote-images-false.html")
    await editor.waitForConnected()

    await editor.paste("", { html: `<p>Look</p><img src="https://example.com/photo.jpg"><p>here</p>` })

    await expect(editor.content).toContainText("Look")
    await expect(editor.content).toContainText("here")
    await expect(editor.content.locator("figure.attachment")).toHaveCount(0)
    expect(await editor.value()).not.toContain("example.com/photo.jpg")
  })

  test("pasted data URI images still upload when remote images are disabled", async ({ page, editor }) => {
    await page.goto("/remote-images-false.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    await editor.paste("", { html: `<img src="data:image/png;base64,${EXAMPLE_PNG}">` })

    await expect.poll(() => calls.blobCreations.length, { timeout: 10_000 }).toBe(1)
    await expect(editor.content.locator("figure.attachment[data-content-type='image/png']")).toHaveCount(1)
  })

  test("pasted image files still upload when remote images are disabled", async ({ page, editor }) => {
    await page.goto("/remote-images-false.html")
    await editor.waitForConnected()
    await mockActiveStorageUploads(page)

    await editor.paste("", { files: [ { base64: EXAMPLE_PNG, name: "example.png", type: "image/png" } ] })

    await expect(editor.content.locator("figure.attachment[data-content-type='image/png']")).toHaveCount(1, { timeout: 10_000 })
  })
})
