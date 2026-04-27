import { readFileSync } from "node:fs"
import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

const EXAMPLE_PNG = readFileSync("test/fixtures/files/example.png").toString(
  "base64",
)
const EXAMPLE2_PNG = readFileSync("test/fixtures/files/example2.png").toString(
  "base64",
)

test.describe("Paste — Adjacent images form a gallery", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("pasting two images one after another groups them into a gallery", async ({ page, editor }) => {
    await editor.paste("", {
      files: [
        { base64: EXAMPLE_PNG, name: "first.png", type: "image/png" },
      ],
    })

    // Wait for the first image to appear in the editor
    await expect(
      editor.content.locator("figure.attachment[data-content-type='image/png']"),
    ).toHaveCount(1, { timeout: 10_000 })

    await editor.paste("", {
      files: [
        { base64: EXAMPLE2_PNG, name: "second.png", type: "image/png" },
      ],
    })

    // Both images should be visible
    await expect(
      editor.content.locator("figure.attachment[data-content-type='image/png']"),
    ).toHaveCount(2, { timeout: 10_000 })

    // And they should be grouped inside a single gallery (matching the
    // behavior of uploading multiple images at once or pasting side-by-side
    // images in Trix).
    const gallery = editor.content.locator(".attachment-gallery")
    await expect(gallery).toHaveCount(1)
    await expect(gallery.locator("figure.attachment")).toHaveCount(2)
  })

  test("pasting three images in succession groups them into a single gallery", async ({ page, editor }) => {
    for (const [ index, base64 ] of [ EXAMPLE_PNG, EXAMPLE2_PNG, EXAMPLE_PNG ].entries()) {
      await editor.paste("", {
        files: [ { base64, name: `image-${index}.png`, type: "image/png" } ],
      })

      await expect(
        editor.content.locator("figure.attachment[data-content-type='image/png']"),
      ).toHaveCount(index + 1, { timeout: 10_000 })
    }

    const gallery = editor.content.locator(".attachment-gallery")
    await expect(gallery).toHaveCount(1)
    await expect(gallery.locator("figure.attachment")).toHaveCount(3)
  })

  test("pasting a non-image after pasting an image does not extend the gallery", async ({ page, editor }) => {
    await editor.paste("", {
      files: [ { base64: EXAMPLE_PNG, name: "first.png", type: "image/png" } ],
    })

    await expect(
      editor.content.locator("figure.attachment[data-content-type='image/png']"),
    ).toHaveCount(1, { timeout: 10_000 })

    // Pasting a non-image should not auto-create a gallery from a single image.
    const PDF_BASE64 = Buffer.from("%PDF-1.4 dummy", "utf8").toString("base64")
    await editor.paste("", {
      files: [ { base64: PDF_BASE64, name: "doc.pdf", type: "application/pdf" } ],
    })

    await expect(
      editor.content.locator("figure.attachment[data-content-type='application/pdf']"),
    ).toHaveCount(1, { timeout: 10_000 })

    // No gallery should have been formed because the second paste isn't an image.
    await expect(editor.content.locator(".attachment-gallery")).toHaveCount(0)
  })
})
