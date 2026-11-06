import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { clickToolbarButton } from "../../helpers/toolbar.js"

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

  for (const [ command, tag ] of [ [ "bold", "strong" ], [ "italic", "em" ], [ "insertCodeBlock", "code" ] ]) {
    test(`typing above text formatted with ${command} from the toolbar stays unformatted`, async ({ page, editor }) => {
      await editor.setValue("<p>Formatted</p>")
      await editor.select("Formatted")
      await clickToolbarButton(page, command)

      await editor.send("Home")
      await editor.send("Enter")
      await editor.send("ArrowUp")
      await editor.send("plain text")

      await assertEditorHtml(editor, `<p>plain text</p><p><${tag}>Formatted</${tag}></p>`)
    })
  }

  test("clicking the line above text formatted from the toolbar types unformatted", async ({ page, editor }) => {
    await editor.setValue("<p>Formatted</p>")
    await editor.select("Formatted")
    await clickToolbarButton(page, "insertCodeBlock")

    await editor.send("Home")
    await editor.send("Enter")
    await editor.content.locator("p").first().click()
    await editor.send("plain text")

    await assertEditorHtml(editor, "<p>plain text</p><p><code>Formatted</code></p>")
  })

  test("typing right after Enter at the start keeps the formatted text's format", async ({ page, editor }) => {
    await editor.setValue("<p>Formatted</p>")
    await editor.select("Formatted")
    await clickToolbarButton(page, "bold")

    await editor.send("Home")
    await editor.send("Enter")
    await editor.send("More ")

    await assertEditorHtml(editor, "<p><br></p><p><strong>More Formatted</strong></p>")
  })
})
