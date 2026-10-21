import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"
import { attachmentTag } from "../../helpers/attachment_helpers.js"

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

  test("converts a selection spanning an image attachment without throwing", async ({ page, editor }) => {
    startMonitoringConsole(page)
    await editor.setValue(`<p>above</p>${attachmentTag("one", "example.png")}<p>below</p>`)
    await selectFrom(editor, "above", "below")

    await editor.clickToolbarButton("insertCodeBlock")
    await editor.flush()

    expect(page).toHaveNoErrors()
    expect(await editor.value()).toMatch(/^<action-text-attachment [^>]*><\/action-text-attachment><pre [^>]*>above<br>below<\/pre>$/)
  })

  test("converts a selection spanning a horizontal divider without throwing", async ({ page, editor }) => {
    startMonitoringConsole(page)
    await editor.setValue("<p>above</p><hr><p>below</p>")
    await selectFrom(editor, "above", "below")

    await editor.clickToolbarButton("insertCodeBlock")
    await editor.flush()

    expect(page).toHaveNoErrors()
    await assertEditorHtml(editor, '<hr><pre data-language="plain" data-highlight-language="plain">above<br>below</pre>')
  })
})

async function selectFrom(editor, startText, endText) {
  await editor.content.evaluate((el, { startText, endText }) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const textNodes = []
    while (walker.nextNode()) textNodes.push(walker.currentNode)
    const start = textNodes.find((node) => node.nodeValue === startText)
    const end = textNodes.find((node) => node.nodeValue === endText)
    const range = document.createRange()
    range.setStart(start, 0)
    range.setEnd(end, end.nodeValue.length)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }, { startText, endText })
  await editor.flush()
}
