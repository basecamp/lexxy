import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Uploading after the editor is disposed", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  // "Cannot read properties of null (reading 'supportsAttachments')":
  // turbo:before-cache disposes the editor in place (Contents#editorElement becomes null)
  // while the element stays in the DOM, so a late drop relayed by a document-level drop zone
  // still calls Contents#uploadFiles on the disposed instance. It must be a no-op, not a crash.
  test("uploading after turbo:before-cache disposes the editor is a no-op", async ({ page, editor }) => {
    await editor.setValue("<p>hello</p>")
    await editor.flush()

    const errorMessage = await page.evaluate(() => {
      const editorElement = document.querySelector("lexxy-editor")

      // Turbo caches the page on every navigation; lexxy resets the editor in place.
      document.dispatchEvent(new Event("turbo:before-cache"))

      const file = new File([ "x" ], "late-drop.png", { type: "image/png" })
      try {
        editorElement.contents.uploadFiles([ file ])
        return null
      } catch (error) {
        return error.message
      }
    })

    expect(errorMessage).toBeNull()
  })
})
