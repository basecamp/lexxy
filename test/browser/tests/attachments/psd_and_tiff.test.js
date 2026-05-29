import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

const buildAttachment = (attrs) => {
  const attrString = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")
  return `<action-text-attachment ${attrString}></action-text-attachment>`
}

const psdAttachment = (attrs = {}) => buildAttachment({
  sgid: "test-sgid-psd",
  "content-type": "image/vnd.adobe.photoshop",
  filename: "example.psd",
  filesize: "108",
  url: "/rails/active_storage/blobs/test-sgid-psd/example.psd",
  ...attrs,
})

const tifAttachment = (attrs = {}) => buildAttachment({
  sgid: "test-sgid-tif",
  "content-type": "image/tiff",
  filename: "example.tif",
  filesize: "260",
  url: "/rails/active_storage/blobs/test-sgid-tif/example.tif",
  ...attrs,
})

const pngAttachment = (attrs = {}) => buildAttachment({
  sgid: "test-sgid-png",
  "content-type": "image/png",
  filename: "example.png",
  filesize: "321",
  url: "/rails/active_storage/blobs/test-sgid-png/example.png",
  ...attrs,
})

test.describe("PSD and TIFF attachments", () => {
  test.describe("uploaded without server-side preview", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/attachments.html")
      await page.waitForSelector("lexxy-editor[connected]")
      await page.waitForSelector("lexxy-toolbar[connected]")
      await mockActiveStorageUploads(page)
    })

    test("PSD uploaded alone renders as a file attachment", async ({ page, editor }) => {
      await editor.uploadFile("test/fixtures/files/example.psd")

      const figure = page.locator("figure.attachment")
      await expect(figure).toBeVisible()
      await expect(figure).toHaveClass(/attachment--file/)
      await expect(figure).toHaveClass(/attachment--psd/)
      await expect(figure.locator("img")).toHaveCount(0)
      await expect(figure.locator(".attachment__icon")).toBeVisible()
      await expect(page.locator(".attachment-gallery")).toHaveCount(0)
    })

    test("TIFF uploaded alone renders as a file attachment", async ({ page, editor }) => {
      await editor.uploadFile("test/fixtures/files/example.tif")

      const figure = page.locator("figure.attachment")
      await expect(figure).toBeVisible()
      await expect(figure).toHaveClass(/attachment--file/)
      await expect(figure).toHaveClass(/attachment--tif/)
      await expect(figure.locator("img")).toHaveCount(0)
      await expect(figure.locator(".attachment__icon")).toBeVisible()
      await expect(page.locator(".attachment-gallery")).toHaveCount(0)
    })

    test("PSD and TIFF uploaded with images stay out of the gallery", async ({ page, editor }) => {
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
        "test/fixtures/files/example.psd",
        "test/fixtures/files/example.tif",
      ])

      const gallery = page.locator(".attachment-gallery")
      await expect(gallery).toBeVisible()
      await expect(gallery.locator("figure.attachment")).toHaveCount(2)
      await expect(gallery.locator(".attachment--psd, .attachment--tif")).toHaveCount(0)

      const psdFigure = page.locator("figure.attachment.attachment--psd")
      await expect(psdFigure).toBeVisible()
      await expect(psdFigure).toHaveClass(/attachment--file/)
      await expect(psdFigure.locator("img")).toHaveCount(0)

      const tifFigure = page.locator("figure.attachment.attachment--tif")
      await expect(tifFigure).toBeVisible()
      await expect(tifFigure).toHaveClass(/attachment--file/)
      await expect(tifFigure.locator("img")).toHaveCount(0)
    })
  })

  test.describe("uploaded with server-side preview", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/attachments.html")
      await page.waitForSelector("lexxy-editor[connected]")
      await page.waitForSelector("lexxy-toolbar[connected]")
      await mockActiveStorageUploads(page, {
        extraPreviewableTypes: ["image/vnd.adobe.photoshop", "image/tiff"],
      })
    })

    test("PSD and TIFF stay out of the gallery even when server marks them previewable", async ({ page, editor }) => {
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
        "test/fixtures/files/example.psd",
        "test/fixtures/files/example.tif",
      ])

      const gallery = page.locator(".attachment-gallery")
      await expect(gallery).toBeVisible()
      await expect(gallery.locator("figure.attachment")).toHaveCount(2)
      await expect(gallery.locator(".attachment--psd, .attachment--tif")).toHaveCount(0)

      await expect(page.locator("figure.attachment.attachment--psd")).toBeVisible()
      await expect(page.locator("figure.attachment.attachment--tif")).toBeVisible()
    })
  })

  test.describe("setValue with previewable='true'", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/attachments.html")
      await page.waitForSelector("lexxy-editor[connected]")
      await mockActiveStorageUploads(page)
    })

    test("PSD with previewable='true' renders as a preview", async ({ page, editor }) => {
      await editor.setValue(psdAttachment({ previewable: "true" }))
      await editor.flush()

      const figure = page.locator("figure.attachment.attachment--psd")
      await expect(figure).toBeVisible()
      await expect(figure).toHaveClass(/attachment--preview/)
      await expect(figure.locator("img")).toHaveCount(1)
    })

    test("TIFF with previewable='true' renders as a preview", async ({ page, editor }) => {
      await editor.setValue(tifAttachment({ previewable: "true" }))
      await editor.flush()

      const figure = page.locator("figure.attachment.attachment--tif")
      await expect(figure).toBeVisible()
      await expect(figure).toHaveClass(/attachment--preview/)
      await expect(figure.locator("img")).toHaveCount(1)
    })

    test("previewable PSD in an image-gallery markup is ejected from the gallery", async ({ page, editor }) => {
      await editor.setValue(`<div class="attachment-gallery">
        ${pngAttachment({ sgid: "png-1" })}
        ${pngAttachment({ sgid: "png-2" })}
        ${psdAttachment({ previewable: "true" })}
      </div>`)
      await editor.flush()

      const gallery = page.locator(".attachment-gallery")
      await expect(gallery).toBeVisible()
      await expect(gallery.locator("figure.attachment")).toHaveCount(2)
      await expect(gallery.locator(".attachment--psd")).toHaveCount(0)

      const psdFigure = page.locator("figure.attachment.attachment--psd")
      await expect(psdFigure).toBeVisible()
      await expect(psdFigure).toHaveClass(/attachment--preview/)
      await expect(psdFigure.locator("img")).toHaveCount(1)
    })
  })
})
