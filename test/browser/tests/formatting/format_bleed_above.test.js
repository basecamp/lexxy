import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Formatting does not bleed onto text typed above", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.focus()
  })

  test("Enter at the start of a blockquote then typing above stays plain", async ({ editor }) => {
    await editor.setValue("<blockquote><p>Quoted</p></blockquote>")
    await editor.click()

    await editor.send("Home")
    await editor.send("Enter")
    await editor.send("ArrowUp")
    await editor.send("plain text")

    await assertEditorHtml(editor, "<p>plain text</p><blockquote><p>Quoted</p></blockquote>")
  })

  test("typing above bold text pushed down stays unformatted", async ({ editor }) => {
    await editor.setValue("<p><strong>Bold</strong></p>")
    await editor.click()

    await editor.send("Home")
    await editor.send("Enter")
    await editor.send("ArrowUp")
    await editor.send("plain text")

    await assertEditorHtml(editor, "<p>plain text</p><p><strong>Bold</strong></p>")
  })

  test("typing above italic text pushed down stays unformatted", async ({ editor }) => {
    await editor.setValue("<p><em>Italic</em></p>")
    await editor.click()

    await editor.send("Home")
    await editor.send("Enter")
    await editor.send("ArrowUp")
    await editor.send("plain text")

    await assertEditorHtml(editor, "<p>plain text</p><p><em>Italic</em></p>")
  })
})
