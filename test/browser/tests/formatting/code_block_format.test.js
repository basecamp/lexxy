import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { clickToolbarButton } from "../../helpers/toolbar.js"

test.describe("Code block formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("does not absorb the block above when the selection anchors at its end", async ({ page, editor }) => {
    await editor.setValue("<p>ABCD:</p><p>pasted one<br>pasted two</p>")

    await editor.content.evaluate((el) => {
      const paragraphs = el.querySelectorAll("p")
      const range = document.createRange()
      range.setStart(paragraphs[0], paragraphs[0].childNodes.length)
      const walker = document.createTreeWalker(paragraphs[1], NodeFilter.SHOW_TEXT)
      let lastTextNode, node
      while ((node = walker.nextNode())) lastTextNode = node
      range.setEnd(lastTextNode, lastTextNode.nodeValue.length)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    })
    await editor.flush()

    await clickToolbarButton(page, "insertCodeBlock")

    await assertEditorHtml(editor, '<p>ABCD:</p><pre data-language="plain" data-highlight-language="plain">pasted one<br>pasted two</pre>')
  })

  test("converts a selection spanning multiple paragraphs", async ({ page, editor }) => {
    await editor.setValue("<p>before</p><p>one</p><p>two</p>")

    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let startNode, endNode, node
      while ((node = walker.nextNode())) {
        if (node.nodeValue === "one") startNode = node
        if (node.nodeValue === "two") endNode = node
      }
      const range = document.createRange()
      range.setStart(startNode, 0)
      range.setEnd(endNode, endNode.nodeValue.length)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    })
    await editor.flush()

    await clickToolbarButton(page, "insertCodeBlock")

    await assertEditorHtml(editor, '<p>before</p><pre data-language="plain" data-highlight-language="plain">one<br>two</pre>')
  })
})
