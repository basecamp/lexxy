import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Markdown heading shortcut", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("typing # space creates h2", async ({ editor }) => {
    await editor.send("# ")
    await editor.send("hello")

    await assertEditorHtml(editor, "<h2>hello</h2>")
  })

  test("typing ## space creates h3", async ({ editor }) => {
    await editor.send("## ")
    await editor.send("hello")

    await assertEditorHtml(editor, "<h3>hello</h3>")
  })

  test("typing ### space creates h4", async ({ editor }) => {
    await editor.send("### ")
    await editor.send("hello")

    await assertEditorHtml(editor, "<h4>hello</h4>")
  })

  test("typing #### space does not create a heading", async ({ editor }) => {
    await editor.send("#### ")
    await editor.send("hello")

    await assertEditorHtml(editor, "<p>#### hello</p>")
  })

  test("typing # space on a new line after text", async ({ editor }) => {
    await editor.send("hello")
    await editor.send("Enter")
    await editor.send("# ")
    await editor.send("world")

    await assertEditorHtml(editor, "<p>hello</p><h2>world</h2>")
  })
})
