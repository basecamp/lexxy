import { test } from "../../test_helper.js"
import { assertEditorPlainText } from "../../helpers/assertions.js"

test.describe("Paste — Markdown that renders to nothing", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("preserves a block of footnote definitions", async ({ editor }) => {
    const text = "[^1]: https://hey.com\n[^2]: https://pagecord.com\n[^3]: https://basecamp.com"

    await editor.paste(text)

    await assertEditorPlainText(editor, text)
  })

  test("preserves a block of link reference definitions", async ({ editor }) => {
    const text = "[1]: https://hey.com\n[2]: https://pagecord.com"

    await editor.paste(text)

    await assertEditorPlainText(editor, text)
  })

  test("preserves a line that is only an HTML comment", async ({ editor }) => {
    const text = "<!-- just a comment -->"

    await editor.paste(text)

    await assertEditorPlainText(editor, text)
  })
})
