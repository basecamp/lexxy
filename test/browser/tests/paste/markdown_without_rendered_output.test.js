import { test } from "../../test_helper.js"
import { assertEditorHtml, assertEditorPlainText } from "../../helpers/assertions.js"

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

  test("an empty paste leaves the selection alone", async ({ editor }) => {
    await editor.send("Hello everyone")
    await editor.select("everyone")

    await editor.paste("")

    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })
})
