import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Inserting a bullet inside a blockquote with inline content", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.focus()
  })

  test("lists a quote that holds text directly without losing the content", async ({ editor }) => {
    await editor.setValue("<blockquote>First line</blockquote>")
    await editor.flush()

    await editor.content.click()
    await editor.send("End")
    await editor.clickToolbarButton("insertUnorderedList")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<blockquote><ul><li value=\"1\">First line</li></ul></blockquote>",
    )
  })
})
