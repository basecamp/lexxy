import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Typing above formatted content", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.focus()
  })

  test("Enter at the start of a blockquote, then typing above, stays unformatted", async ({ editor }) => {
    await editor.setValue("<blockquote><p>Quoted</p></blockquote>")
    await editor.send("Home")
    await editor.send("Enter")
    await editor.send("ArrowUp")
    await editor.send("plain text")

    await assertEditorHtml(editor, "<p>plain text</p><blockquote><p>Quoted</p></blockquote>")
  })

  test("Shift+Enter at the start of a blockquote, then typing above, stays unformatted", async ({ editor }) => {
    await editor.setValue("<blockquote><p>Quoted</p></blockquote>")
    await editor.send("Home")
    await editor.send("Shift+Enter")
    await editor.send("ArrowUp")
    await editor.send("plain text")

    await assertEditorHtml(editor, "<blockquote><p>plain text<br>Quoted</p></blockquote>")
  })

  test("typing above bold text inserted at the start stays unformatted", async ({ editor }) => {
    await editor.setValue("<p><strong>Bold</strong></p>")
    await editor.send("Home")
    await editor.send("Enter")
    await editor.send("ArrowUp")
    await editor.send("plain text")

    await assertEditorHtml(editor, "<p>plain text</p><p><strong>Bold</strong></p>")
  })
})
