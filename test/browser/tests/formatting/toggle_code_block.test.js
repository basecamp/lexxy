import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

async function placeCaretInside(editor, text, offset) {
  await editor.click()
  await editor.content.evaluate((el, { text, offset }) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const index = node.nodeValue.indexOf(text)
      if (index !== -1) {
        const range = document.createRange()
        range.setStart(node, index + offset)
        range.collapse(true)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
        break
      }
    }
  }, { text, offset })
  await editor.flush()
}

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
    await placeCaretInside(editor, "item one", 2)

    await editor.clickToolbarButton("insertCodeBlock")

    await assertEditorHtml(editor, '<pre data-language="plain" data-highlight-language="plain">item one<br>nested</pre>')
  })
})
