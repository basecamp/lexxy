import { test } from "../test_helper.js"
import { assertEditorHtml } from "../helpers/assertions.js"

test.describe("Single line", () => {
  test("disable multi-line", async ({ page, editor }) => {
    await page.goto("/posts/new?multi_line_disabled=true")
    await editor.waitForConnected()

    await editor.send("Hello")
    await editor.send("Enter")
    await editor.send("there")

    await assertEditorHtml(editor, "<p>Hellothere</p>")
  })
})
