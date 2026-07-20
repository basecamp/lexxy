import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Toggle code block", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("converts a selection spanning a paragraph and a quote without losing the selection", async ({ editor }) => {
    await editor.setValue("<p>before</p><blockquote><p>quoted</p></blockquote>")
    await editor.selectAll()

    await editor.clickToolbarButton("insertCodeBlock")

    await assertEditorHtml(editor, '<pre data-language="plain" data-highlight-language="plain">before<br>quoted</pre>')
  })

  test("converts a nested list with the caret inside it without losing the selection", async ({ editor }) => {
    await editor.setValue("<ul><li>item one<ul><li>nested</li></ul></li></ul>")
    await editor.placeCaretInside("item one", 2)

    await editor.clickToolbarButton("insertCodeBlock")

    await assertEditorHtml(editor, '<pre data-language="plain" data-highlight-language="plain">item one<br>nested</pre>')
  })
})
