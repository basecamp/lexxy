import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const pdfAttachment = (attrs = {}) => {
  const defaults = {
    sgid: "test-sgid-123",
    "content-type": "application/pdf",
    filename: "protected.pdf",
    filesize: "12345",
    previewable: "false",
    url: "http://example.com/protected.pdf",
  }
  const merged = { ...defaults, ...attrs }
  const attrString = Object.entries(merged).map(([k, v]) => `${k}="${v}"`).join(" ")
  return `<action-text-attachment ${attrString}></action-text-attachment>`
}

test.describe("Non-previewable attachment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("previewable='false' renders as file attachment", async ({ page, editor }) => {
    await editor.setValue(pdfAttachment({ previewable: "false" }))
    await editor.flush()

    const figure = page.locator("figure.attachment")
    await expect(figure).toBeVisible()
    await expect(figure).toHaveClass(/attachment--file/)
    await expect(figure.locator("img")).toHaveCount(0)
    await expect(figure.locator(".attachment__icon")).toBeVisible()
    await expect(figure.locator(".attachment__name")).toHaveText("protected.pdf")
  })

  test("broken preview image falls back to file rendering", async ({ page, editor }) => {
    const brokenUrl = "http://localhost:9999/broken-preview.png"

    await editor.setValue(pdfAttachment({ previewable: "true", url: brokenUrl }))
    await editor.flush()

    const figure = page.locator("figure.attachment")
    await expect(figure).toBeVisible()

    // After onerror fires, the figure should swap to file rendering
    await expect(figure).toHaveClass(/attachment--file/, { timeout: 5000 })
    await expect(figure.locator("img")).toHaveCount(0)
    await expect(figure.locator(".attachment__icon")).toBeVisible()
    await expect(figure.locator(".attachment__name")).toHaveText("protected.pdf")
  })

  test("exportDOM preserves previewable='true' after visual fallback", async ({ page, editor }) => {
    const brokenUrl = "http://localhost:9999/broken-preview.png"

    await editor.setValue(pdfAttachment({ previewable: "true", url: brokenUrl }))
    await editor.flush()

    // Wait for fallback to complete
    const figure = page.locator("figure.attachment")
    await expect(figure).toHaveClass(/attachment--file/, { timeout: 5000 })

    // The serialized output should still have previewable="true"
    const value = await editor.value()
    expect(value).toContain('previewable="true"')
    expect(value).toContain('sgid="test-sgid-123"')
    expect(value).toContain('filename="protected.pdf"')
  })

  test("serializes correctly in editor value", async ({ editor }) => {
    await editor.setValue(pdfAttachment({ previewable: "false" }))
    await editor.flush()

    const value = await editor.value()
    expect(value).toContain("action-text-attachment")
    expect(value).toContain('sgid="test-sgid-123"')
    expect(value).toContain('filename="protected.pdf"')
    // previewable="false" should not be serialized (it's falsy)
    expect(value).not.toContain("previewable")
  })
})
