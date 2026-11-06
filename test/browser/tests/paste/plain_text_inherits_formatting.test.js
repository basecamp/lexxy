import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml } from "../../helpers/assertions.js"

// "Paste and Match Style" puts only text/plain on the clipboard. The pasted
// text should take the formatting at the caret, as typing there would.
test.describe("Paste — Plain text inherits the formatting at the caret", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("plain text pasted inside bold text is bold", async ({ editor }) => {
    await editor.setValue("<p><strong>bold text</strong></p>")
    await editor.placeCaretInside("bold text", 4)

    await editor.paste("XYZ")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("strong")).toHaveCount(1)
      await expect(content.locator("strong")).toHaveText("boldXYZ text")
    })
    await assertEditorHtml(editor, "<p><strong>boldXYZ text</strong></p>")
  })

  test("plain text pasted inside highlighted bold text keeps the bold and the highlight", async ({ editor }) => {
    await editor.setValue('<p><strong><mark style="background-color: var(--highlight-bg-1);">marked text</mark></strong></p>')
    await editor.placeCaretInside("marked text", 6)

    await editor.paste("XYZ")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("mark")).toHaveCount(1)
      await expect(content.locator("mark")).toHaveText("markedXYZ text")
      await expect(content.locator("mark")).toHaveAttribute("style", /background-color: var\(--highlight-bg-1\)/)
      await expect(content.locator("strong")).toHaveText("markedXYZ text")
    })
  })

  test("multi-line plain text pasted inside italic text is italic on every line", async ({ editor }) => {
    await editor.setValue("<p><em>italic text</em></p>")
    await editor.placeCaretInside("italic text", 6)

    await editor.paste("one\ntwo")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("em")).toHaveText([ "italicone", "two text" ])
    })
  })

  test("plain text pasted over a bold selection is bold", async ({ editor }) => {
    await editor.setValue("<p>plain <strong>bold</strong> plain</p>")
    await editor.select("bold")

    await editor.paste("XYZ")

    await assertEditorHtml(editor, "<p>plain <strong>XYZ</strong> plain</p>")
  })

  test("plain text pasted into unformatted text stays unformatted", async ({ editor }) => {
    await editor.setValue("<p>plain text</p>")
    await editor.placeCaretInside("plain text", 5)

    await editor.paste("XYZ")

    await assertEditorHtml(editor, "<p>plainXYZ text</p>")
  })
})
