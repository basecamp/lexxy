import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

const PDF_BASE64 = Buffer.from("%PDF-1.4 dummy", "utf8").toString("base64")

const pdfAttachment =
  '<action-text-attachment sgid="test-sgid-123" content-type="application/pdf" filename="report.pdf" ' +
  'filesize="12345" previewable="false" url="http://example.com/report.pdf"></action-text-attachment>'

test.describe("Uploading into an unsupported selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  // "Cannot read properties of undefined (reading 'getNode')":
  // node selections have no anchor, so ShadowRootNodeInserter.handles crashed
  // instead of letting NodeSelectionNodeInserter handle the insertion.
  test("pasting a file while an attachment is node-selected inserts after it", async ({ page, editor }) => {
    await editor.setValue(pdfAttachment)
    await editor.flush()

    const figure = editor.content.locator("figure.attachment")
    await expect(figure).toBeVisible()

    await figure.click()
    await expect(figure).toHaveClass(/node--selected/)

    await editor.paste("", {
      files: [ { base64: PDF_BASE64, name: "pasted.pdf", type: "application/pdf" } ],
    })

    await expect(editor.content.locator("figure.attachment")).toHaveCount(2, { timeout: 10_000 })
  })
})
