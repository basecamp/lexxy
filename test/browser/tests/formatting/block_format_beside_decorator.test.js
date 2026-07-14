import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

// Selects from the first text node to the last text node in the editor,
// mirroring the production selection shapes that border a decorator: an
// endpoint sitting flush against a block edge (offset 0 or the end of the
// text) lands next to the <hr>, which is the case that used to throw.
async function selectAcrossDivider(editor, { anchorAtEnd = false, focusAtEnd = false } = {}) {
  await editor.click()
  await editor.content.evaluate((el, { anchorAtEnd, focusAtEnd }) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const textNodes = []
    let node
    while ((node = walker.nextNode())) textNodes.push(node)
    const firstText = textNodes[0]
    const lastText = textNodes[textNodes.length - 1]

    const range = document.createRange()
    range.setStart(firstText, anchorAtEnd ? firstText.nodeValue.length : 0)
    range.setEnd(lastText, focusAtEnd ? lastText.nodeValue.length : 0)

    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }, { anchorAtEnd, focusAtEnd })
  await editor.flush()
}

test.describe("Block formats next to decorator nodes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("focus flush after a horizontal divider walks back past it, leaving the trailing block unformatted", async ({ editor }) => {
    await editor.setValue("<p>alpha</p><hr><p>beta</p>")
    await selectAcrossDivider(editor)

    await editor.clickToolbarButton("heading-large")

    await assertEditorHtml(editor, "<h2>alpha</h2><hr><p>beta</p>")
  })

  test("anchor flush before a horizontal divider walks forward past it, leaving the leading block unformatted", async ({ editor }) => {
    await editor.setValue("<p>alpha</p><hr><p>beta</p>")
    await selectAcrossDivider(editor, { anchorAtEnd: true, focusAtEnd: true })

    await editor.clickToolbarButton("heading-large")

    await assertEditorHtml(editor, "<p>alpha</p><hr><h2>beta</h2>")
  })

  test("selecting content in both blocks around a horizontal divider formats both and keeps the divider", async ({ editor }) => {
    await editor.setValue("<p>alpha</p><hr><p>beta</p>")
    await selectAcrossDivider(editor, { focusAtEnd: true })

    await editor.clickToolbarButton("heading-large")

    await assertEditorHtml(editor, "<h2>alpha</h2><hr><h2>beta</h2>")
  })

  // Both endpoints flush against the divider selects only the divider itself.
  // This behaves the same as the equivalent selection across two adjacent
  // paragraphs with no divider between them: everything gets wrapped.
  test("quote format with both edges flush against a horizontal divider wraps everything", async ({ editor }) => {
    await editor.setValue("<p>alpha</p><hr><p>beta</p>")
    await selectAcrossDivider(editor, { anchorAtEnd: true })

    await editor.clickToolbarButton("insertQuoteBlock")

    await assertEditorHtml(editor, "<blockquote><p>alpha</p><hr><p>beta</p></blockquote>")
  })
})
