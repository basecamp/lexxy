import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

const IMAGE_ATTACHMENT =
  '<action-text-attachment content-type="image/png" url="http://example.com/image.png" filename="photo.png"></action-text-attachment>'

test.describe("Block formatting with selected attachment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("bullet list does not crash when attachment is selected", async ({ page, editor }) => {
    await editor.setValue(`<p>Some text</p>${IMAGE_ATTACHMENT}`)
    await editor.flush()

    // Click the attachment to select it (creates a NodeSelection)
    await editor.content.locator("figure.attachment").click()
    await editor.flush()

    // Verify the attachment is selected
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("figure.node--selected")).toHaveCount(1)
    })

    // Click the bullet list button — this should not crash
    await page.getByRole("button", { name: "Bullet list" }).click()
    await editor.flush()

    // The editor should still be functional — type some text to verify
    await editor.content.locator("p").first().click()
    await editor.send("Still works")
    await editor.flush()

    const value = await editor.value()
    expect(value).toContain("Still works")
  })

  test("numbered list does not crash when attachment is selected", async ({ page, editor }) => {
    await editor.setValue(`<p>Some text</p>${IMAGE_ATTACHMENT}`)
    await editor.flush()

    // Click the attachment to select it (creates a NodeSelection)
    await editor.content.locator("figure.attachment").click()
    await editor.flush()

    // Verify the attachment is selected
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("figure.node--selected")).toHaveCount(1)
    })

    // Click the numbered list button — this should not crash
    await page.getByRole("button", { name: "Numbered list" }).click()
    await editor.flush()

    // The editor should still be functional — type some text to verify
    await editor.content.locator("p").first().click()
    await editor.send("Still works")
    await editor.flush()

    const value = await editor.value()
    expect(value).toContain("Still works")
  })
})
