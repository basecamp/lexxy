import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Non-previewable attachment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("renders as file attachment, not broken image", async ({ page, editor }) => {
    const attachmentHtml = [
      '<action-text-attachment',
      '  sgid="test-sgid-123"',
      '  content-type="application/pdf"',
      '  filename="protected.pdf"',
      '  filesize="12345"',
      '  previewable="false"',
      '  url="http://example.com/protected.pdf"',
      '></action-text-attachment>',
    ].join(" ")

    await editor.setValue(attachmentHtml)
    await editor.flush()

    // The attachment should render as a file (not an image preview)
    const figure = page.locator("figure.attachment")
    await expect(figure).toBeVisible()

    // It should have the --file class, not --preview
    await expect(figure).toHaveClass(/attachment--file/)

    // It should NOT have an <img> element (since it's not previewable)
    await expect(figure.locator("img")).toHaveCount(0)

    // It should show the file icon and filename
    await expect(figure.locator(".attachment__icon")).toBeVisible()
    await expect(figure.locator(".attachment__name")).toHaveText("protected.pdf")
  })

  test("serializes correctly in editor value", async ({ page, editor }) => {
    const attachmentHtml = [
      '<action-text-attachment',
      '  sgid="test-sgid-123"',
      '  content-type="application/pdf"',
      '  filename="protected.pdf"',
      '  filesize="12345"',
      '  previewable="false"',
      '  url="http://example.com/protected.pdf"',
      '></action-text-attachment>',
    ].join(" ")

    await editor.setValue(attachmentHtml)
    await editor.flush()

    // The editor value should contain a valid action-text-attachment element
    const value = await editor.value()
    expect(value).toContain("action-text-attachment")
    expect(value).toContain('sgid="test-sgid-123"')
    expect(value).toContain('filename="protected.pdf"')
  })
})
