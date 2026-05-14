import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"
import { selectAttachment } from "../../helpers/attachment_helpers.js"

test.describe("Attachment caption", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("Escape from caption restores attachment selection and editor focus", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = page.locator("figure.attachment figcaption textarea")
    await expect(caption).toBeVisible({ timeout: 10_000 })

    await caption.click()
    await caption.pressSequentially("Hello")
    await caption.press("Escape")

    await expect(page.locator("figure.attachment.node--selected")).toHaveCount(1)
    await expect(editor.content).toBeFocused()
  })

  test("Tab from a selected attachment focuses the caption textarea", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await selectAttachment(figure)
    await editor.focus()
    await page.keyboard.press("Tab")

    await expect(figure.locator("figcaption textarea")).toBeFocused()
  })
})
