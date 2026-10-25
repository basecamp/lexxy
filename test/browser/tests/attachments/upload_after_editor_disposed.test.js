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
  // disconnecting disposes the editor (Contents#editorElement becomes null), so a late drop
  // relayed by a document-level drop zone still calls Contents#uploadFiles on the disposed
  // instance. It must be a no-op, not a crash.
  test("uploading after the editor is disposed is a no-op", async ({ page, editor }) => {
    await editor.setValue("<p>hello</p>")
    await editor.flush()

    const errorMessage = await page.evaluate(() => {
      const editorElement = document.querySelector("lexxy-editor")
      editorElement.remove()

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
