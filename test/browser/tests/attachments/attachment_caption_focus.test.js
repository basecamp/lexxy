import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Attachment caption focus", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("Tab past an attachment does not fall into its caption", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")
    await expect(captionOf(page)).toBeVisible({ timeout: 10_000 })

    // The reported bug: caret in ordinary text, nothing selected, and Tab lands
    // in an image caption instead of moving on.
    await editor.focus()
    await page.keyboard.press("Home")
    await page.keyboard.type("Hello")
    await expect(page.locator("figure.attachment.node--selected")).toHaveCount(0)

    await page.keyboard.press("Tab")

    await expect(captionOf(page)).not.toBeFocused()
  })

  test("Tab from a selected attachment focuses the caption textarea", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment")
    await expect(figure).toBeVisible({ timeout: 10_000 })
    await selectAttachment(figure)

    await page.keyboard.press("Tab")

    await expect(figure.locator("figcaption textarea")).toBeFocused()
  })

  test("Escape from caption restores attachment selection and editor focus", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = captionOf(page)
    await expect(caption).toBeVisible({ timeout: 10_000 })

    await caption.click()
    await caption.pressSequentially("Hello")
    await caption.press("Escape")

    await expect(page.locator("figure.attachment.node--selected")).toHaveCount(1)
    await expect(editor.content).toBeFocused()
  })
})

function captionOf(page) {
  return page.locator("figure.attachment figcaption textarea")
}

async function selectAttachment(figure) {
  await figure.locator("img[src*='/blobs/']").waitFor()
  await figure.locator("img").click()
  await expect(figure).toHaveClass(/node--selected/)
}
