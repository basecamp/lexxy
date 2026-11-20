import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"
import { selectGalleryAtOffset } from "../../helpers/gallery_test_helpers.js"

// Android's WebView scrolls the caret into view whenever the DOM selection is
// set, so setting it on every upload progress tick keeps dragging the page back
// to the caret while a large file uploads.
test.describe("Upload progress and the DOM selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.uploadRequests = []
      const open = XMLHttpRequest.prototype.open
      XMLHttpRequest.prototype.open = function (method, url, ...args) {
        if (method === "PUT") window.uploadRequests.push(this)
        return open.call(this, method, url, ...args)
      }

      window.selectionWrites = 0
      for (const method of [ "setBaseAndExtent", "addRange", "removeAllRanges", "collapse", "extend" ]) {
        const original = Selection.prototype[method]
        Selection.prototype[method] = function (...args) {
          window.selectionWrites++
          return original.apply(this, args)
        }
      }
    })

    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page, { holdFileUploads: true })
  })

  test("progress ticks don't set the DOM selection with the caret after the upload", async ({ page, editor }) => {
    await startHeldUpload(page, editor)
    expect(await editor.isFocused()).toBe(true)

    expect(await sendProgressTicks(page)).toBe(0)
    await expect(page.locator("figure.attachment progress")).toHaveJSProperty("value", 90)

    await editor.send("After")
    await expect(editor.content.locator("p").last()).toHaveText("After")
  })

  test("progress ticks don't set the DOM selection with the caret in text", async ({ page, editor }) => {
    await startHeldUpload(page, editor)
    await editor.send("After")

    expect(await sendProgressTicks(page)).toBe(0)

    await editor.send("!")
    await expect(editor.content.locator("p").last()).toHaveText("After!")
  })

  test("a failed upload keeps the caret after it", async ({ page, editor }) => {
    await startHeldUpload(page, editor)

    await page.evaluate(() => window.uploadRequests[0].dispatchEvent(new ProgressEvent("error")))
    await expect(page.locator("figure.attachment progress")).toHaveCount(0)

    await editor.send("After")
    await expect(editor.content.locator("p").last()).toHaveText("After")
  })

  test("failed uploads in a gallery keep the caret after them", async ({ page, editor }) => {
    await editor.focus()
    await editor.uploadFile([ "test/fixtures/files/example.png", "test/fixtures/files/example2.png" ])

    const gallery = page.locator(".attachment-gallery")
    await expect(gallery.locator("figure.attachment progress")).toHaveCount(2, { timeout: 10_000 })
    await expect.poll(() => page.evaluate(() => window.uploadRequests.length)).toBe(2)

    await selectGalleryAtOffset(page, editor, 2)
    expect(await domCaretOffsetInGallery(page)).toBe(2)

    await page.evaluate(() => window.uploadRequests.forEach((request) => request.dispatchEvent(new ProgressEvent("error"))))
    await expect(gallery.locator("figure.attachment progress")).toHaveCount(0)
    await editor.flush()

    expect(await domCaretOffsetInGallery(page)).toBe(2)
  })
})

async function domCaretOffsetInGallery(page) {
  return page.evaluate(() => {
    const selection = window.getSelection()
    return selection.anchorNode?.classList?.contains("attachment-gallery") ? selection.anchorOffset : null
  })
}

async function startHeldUpload(page, editor) {
  const diskUploadStarted = page.waitForRequest((request) =>
    request.url().includes("/rails/active_storage/disk/") && request.method() === "PUT",
  )

  await editor.send("Before")
  await editor.uploadFile("test/fixtures/files/example.png")

  await expect(page.locator("figure.attachment progress")).toBeVisible({ timeout: 10_000 })
  await diskUploadStarted
}

// Dispatches upload progress events the way the browser would, and returns how
// many times the DOM selection was set while they were handled.
async function sendProgressTicks(page) {
  return page.evaluate(async () => {
    const [ request ] = window.uploadRequests
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))

    window.selectionWrites = 0
    for (let loaded = 10; loaded < 100; loaded += 10) {
      request.upload.dispatchEvent(new ProgressEvent("progress", { lengthComputable: true, loaded, total: 100 }))
      await nextFrame()
    }
    return window.selectionWrites
  })
}
