import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

// A plain-text editor without attachments pastes only the clipboard's text, even when the
// clipboard also holds formatted HTML.
test.describe("Paste into a plain-text editor with attachments disabled", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/rich-text-and-attachments-disabled.html")
    await editor.waitForConnected()
  })

  test("pasted HTML comes in as plain text", async ({ editor }) => {
    await editor.setValue("<p>x</p>")
    await editor.select("x")
    await editor.paste("Hello world", { html: "<p><strong>Hello</strong> <a href=\"https://example.com\">world</a></p>" })

    await assertEditorHtml(editor, "<p>Hello world</p>")
  })
})
