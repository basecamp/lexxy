import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

// Pasting a URL routes through Clipboard#pastePlainText, which inserts a link node directly
// via RangeSelection.insertNodes — bypassing the NodeInserter normalization that the rich-text
// and markdown paste paths use. When the caret is an element point on a block container (e.g.
// the blockquote itself, between two paragraphs), inserting a link node at that point produces
// an invalid tree and crashes during reconciliation with Lexical error #222
// (ElementDOMSlot.insertChild: before is not in element).
test.describe("Paste a URL with the caret on a quote element", () => {
  let pageErrors

  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error.message))

    await editor.setValue("<blockquote><p>first</p><p>second</p></blockquote>")
    await editor.focus()
    await placeCaretOnQuoteElement(editor)
  })

  test("pasting a bare URL does not crash and lands a link inside the quote", async ({ editor }) => {
    await editor.paste("https://example.com")
    await editor.flush()

    expect(pageErrors).toHaveLength(0)
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator('blockquote a[href="https://example.com"]')).toHaveText("https://example.com")
    })
  })
})

// Real mouse interaction can't reliably produce an element point on the quote node itself
// (Lexical normalizes DOM selections to leaves), so set the Lexical selection directly,
// mirroring the selection state Sentry reported. Offset 1 is the gap between the two paragraphs.
async function placeCaretOnQuoteElement(editor) {
  await editor.locator.evaluate((editorElement) => {
    editorElement.editor.update(() => {
      const editorState = editorElement.editor._pendingEditorState
      const quote = editorState._nodeMap.get(editorState._nodeMap.get("root").__first)
      quote.select(1, 1)
    })
  })
}
