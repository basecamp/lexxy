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

  // "Cannot read properties of null (reading 'selectEnd')":
  // uploading a file while the caret sits in an empty code block leaves no node
  // at the caret, and CodeNodeInserter crashed trying to select it. Driven through
  // Contents#uploadFiles directly, the same entry point document-level drop zones use.
  // A <code> block can't hold an attachment, so the file lands after the block rather
  // than being silently discarded.
  test("uploading a file with the caret in a code block lands it after the block", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>keep me</code></pre>')
    await editor.flush()

    await editor.click()

    const errorMessage = await page.evaluate(() => {
      const editorElement = document.querySelector("lexxy-editor")
      const file = new File([ "%PDF-1.4 dummy" ], "dropped.pdf", { type: "application/pdf" })
      try {
        editorElement.contents.uploadFiles([ file ])
        return null
      } catch (error) {
        return error.message
      }
    })

    expect(errorMessage).toBeNull()

    // The file is uploaded (not silently dropped) and the code block keeps its contents.
    await expect(editor.content.locator("figure.attachment")).toHaveCount(1, { timeout: 10_000 })
    await expect(editor.content.locator("code")).toContainText("keep me")
  })
})
