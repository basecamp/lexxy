import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

test.describe("Enter / Shift+Enter with the caret on a quote element", () => {
  let pageErrors

  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()

    pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error.message))

    await editor.focus()
    await editor.setValue("<blockquote><p>first</p><p>second</p></blockquote>")
    await editor.placeCaretOnQuoteElement()
  })

  test("Shift+Enter does not crash and keeps the quote content", async ({ editor }) => {
    await editor.content.press("Shift+Enter")
    await editor.flush()

    expect(pageErrors).toHaveLength(0)
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toContainText("first")
      await expect(content.locator("blockquote")).toContainText("second")
    })
  })

  test("Enter does not crash and keeps the quote content", async ({ editor }) => {
    await editor.content.press("Enter")
    await editor.flush()

    expect(pageErrors).toHaveLength(0)
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toContainText("first")
      await expect(content.locator("blockquote")).toContainText("second")
    })
  })
})
