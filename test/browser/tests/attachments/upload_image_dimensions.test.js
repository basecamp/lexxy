import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

// example.png is 604×361 pixels.
const IMAGE = "test/fixtures/files/example.png"
const REAL_SIZE = "604x361"

test.describe("Uploaded image dimensions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("a single image saves its real pixel size", async ({ editor }) => {
    await editor.uploadFile(IMAGE)

    await expect.poll(() => savedSizes(editor)).toEqual([ REAL_SIZE ])
  })

  test("an image shown smaller than its real size still saves its real pixel size", async ({ editor }) => {
    await editor.locator.evaluate((element) => element.style.maxInlineSize = "300px")

    await editor.uploadFile(IMAGE)

    await expect.poll(() => savedSizes(editor)).toEqual([ REAL_SIZE ])
  })

  for (const count of [ 2, 3, 4 ]) {
    test(`each image in a group of ${count} saves its real pixel size`, async ({ editor }) => {
      await editor.uploadFile(Array(count).fill(IMAGE))

      await expect.poll(() => savedSizes(editor)).toEqual(Array(count).fill(REAL_SIZE))
    })
  }
})

async function savedSizes(editor) {
  if (await editor.content.locator("progress").count() > 0) return "still uploading"

  const html = await editor.value()
  return editor.page.evaluate((html) => {
    const attachments = new DOMParser().parseFromString(html, "text/html").querySelectorAll("action-text-attachment")
    return Array.from(attachments, (attachment) => `${attachment.getAttribute("width")}x${attachment.getAttribute("height")}`)
  }, html)
}
