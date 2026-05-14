import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"
import { selectAttachment } from "../../helpers/attachment_helpers.js"

test.describe("Attachment toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("appears beside a selected attachment and hides on deselect", async ({ page, editor }) => {
    await editor.setValue(
      "<p>Above</p>" +
      '<action-text-attachment sgid="abc" content-type="image/png" url="/example.png" filename="example.png" filesize="100" width="50" height="50" previewable="true" presentation="gallery"></action-text-attachment>'
    )
    await editor.flush()

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible()

    const toolbar = page.locator("lexxy-attachment-toolbar")
    await expect(toolbar).toHaveAttribute("role", "toolbar")
    await expect(toolbar).toBeHidden()

    await selectAttachment(figure)
    await expect(toolbar).toBeVisible()

    await editor.content.locator("p", { hasText: "Above" }).click()
    await expect(toolbar).toBeHidden()
  })

  test("Alt+F10 focuses the remove button; Escape returns focus to the editor", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await selectAttachment(figure)
    await editor.focus()
    await page.keyboard.press("Alt+F10")

    const removeButton = page.locator("lexxy-attachment-toolbar button[aria-label='Remove']")
    await expect(removeButton).toBeFocused()

    await page.keyboard.press("Escape")
    await expect(editor.content).toBeFocused()
    await expect(figure).toHaveClass(/node--selected/)
  })

  test("clicking the remove button deletes the selected attachment", async ({ page, editor }) => {
    await editor.setValue(
      "<p>Before</p>" +
      '<action-text-attachment sgid="abc" content-type="image/png" url="/example.png" filename="example.png" filesize="100" width="50" height="50" previewable="true" presentation="gallery"></action-text-attachment>' +
      "<p>After</p>"
    )
    await editor.flush()

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible()
    await selectAttachment(figure)

    await page.locator("lexxy-attachment-toolbar button[aria-label='Remove']").click()

    await expect(figure).toHaveCount(0)
    await expect(page.locator("lexxy-attachment-toolbar")).toBeHidden()
  })
})
