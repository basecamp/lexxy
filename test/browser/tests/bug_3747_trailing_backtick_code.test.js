import { test } from "../test_helper.js"
import { assertEditorHtml } from "../helpers/assertions.js"

test.describe("Bug #3747: typing leading markdown tag before trailing tag applies formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("typing trailing backtick first, then leading backtick creates inline code", async ({ editor }) => {
    await editor.send("hello")
    await editor.send("`")
    await editor.send("Home")
    await editor.send("`")

    await assertEditorHtml(editor, "<p><code>hello</code></p>")
  })

  test("normal order: leading backtick then trailing backtick creates inline code", async ({ editor }) => {
    await editor.send("`hello`")

    await assertEditorHtml(editor, "<p><code>hello</code></p>")
  })

  test("typing trailing ** first, then leading ** creates bold", async ({ editor }) => {
    await editor.send("hello")
    await editor.send("**")
    await editor.send("Home")
    await editor.send("**")

    await assertEditorHtml(editor, "<p><b><strong>hello</strong></b></p>")
  })

  test("typing trailing * first, then leading * creates italic", async ({ editor }) => {
    await editor.send("hello")
    await editor.send("*")
    await editor.send("Home")
    await editor.send("*")

    await assertEditorHtml(editor, "<p><i><em>hello</em></i></p>")
  })

  test("typing trailing ~~ first, then leading ~~ creates strikethrough", async ({ editor }) => {
    await editor.send("hello")
    await editor.send("~~")
    await editor.send("Home")
    await editor.send("~~")

    await assertEditorHtml(editor, "<p><s>hello</s></p>")
  })
})
