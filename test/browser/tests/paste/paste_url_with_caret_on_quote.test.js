import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

test.describe("Paste URL with the caret on a quote element", () => {
  let pageErrors

  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()

    pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error.message))

    await editor.setValue("<blockquote><p>first</p><p>second</p></blockquote>")
    await editor.focus()
    await editor.placeCaretOnQuoteElement()
  })

  test("pasting a plain-text URL does not crash and creates a link inside the quote", async ({ editor }) => {
    await editor.paste("https://37signals.com")
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator('blockquote a[href="https://37signals.com"]')).toHaveCount(1)
    })
    expect(pageErrors).toHaveLength(0)
  })

  test("pasting a text/uri-list URL does not crash and creates a link inside the quote", async ({ editor }) => {
    await editor.paste(null, { uriList: "https://37signals.com" })
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator('blockquote a[href="https://37signals.com"]')).toHaveCount(1)
    })
    expect(pageErrors).toHaveLength(0)
  })
})
