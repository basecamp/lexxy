import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

// example.png is 604×361 pixels.
const IMAGE = "test/fixtures/files/example.png"
const REAL_SIZE = "604x361"

test.describe("Uploaded image dimensions", () => {
  let uploads

  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")

    // Uploads are held until every preview has loaded, so the size is always
    // taken before the upload finishes.
    uploads = await mockActiveStorageUploads(page, { delayDirectUploadResponse: true })
  })

  test("an image shown at its real size saves its real pixel size", async ({ editor }) => {
    const shownWidths = await uploadImages(editor, uploads, 1)

    expect(shownWidths).toEqual([ 604 ])
    await expect.poll(() => savedSizes(editor)).toEqual([ REAL_SIZE ])
  })

  test("an image shown smaller than its real size saves its real pixel size", async ({ editor }) => {
    await narrowEditor(editor)

    await uploadImages(editor, uploads, 1)

    await expect.poll(() => savedSizes(editor)).toEqual([ REAL_SIZE ])
  })

  for (const count of [ 2, 3, 4 ]) {
    test(`each image in a group of ${count} saves its real pixel size`, async ({ editor }) => {
      await narrowEditor(editor)

      await uploadImages(editor, uploads, count)

      await expect.poll(() => savedSizes(editor)).toEqual(Array(count).fill(REAL_SIZE))
    })
  }
})

// Narrow enough that the image never fits at its real size, alone or in a gallery.
async function narrowEditor(editor) {
  await editor.locator.evaluate((element) => element.style.maxInlineSize = "500px")
}

// Returns the width each preview had on screen when its size was taken.
async function uploadImages(editor, uploads, count) {
  await editor.uploadFile(Array(count).fill(IMAGE))

  const previews = editor.content.locator("figure.attachment img")
  await expect(previews).toHaveCount(count)
  await expect.poll(() => previews.evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true)
  await editor.flush()
  const shownWidths = await previews.evaluateAll((images) => images.map((image) => Math.round(image.getBoundingClientRect().width)))

  await uploads.releaseDirectUploadResponses()
  await expect(editor.content.locator("progress")).toHaveCount(0)

  return shownWidths
}

async function savedSizes(editor) {
  const html = await editor.value()
  return editor.page.evaluate((html) => {
    const attachments = new DOMParser().parseFromString(html, "text/html").querySelectorAll("action-text-attachment")
    return Array.from(attachments, (attachment) => `${attachment.getAttribute("width")}x${attachment.getAttribute("height")}`)
  }, html)
}
