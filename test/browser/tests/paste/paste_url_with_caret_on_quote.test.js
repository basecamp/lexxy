import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

// Pasting a bare URL routes through Clipboard#pastePlainText → Contents#createLink (and the
// text/uri-list variant through Clipboard#insertSingleLinkAt), both of which call
// RangeSelection.insertNodes directly instead of going through NodeInserter. When the caret
// is an element point on a quote element (a block container holding paragraphs), Lexical's
// insertNodes finds no block ancestor with inline children and throws error #211.
// See https://github.com/basecamp/lexxy/pull/1109 for the same crash on the markdown/HTML
// paste path, which was already routed through NodeInserter.
test.describe("Paste URL with the caret on a quote element", () => {
  let pageErrors

  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()

    pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error.message))

    await editor.setValue("<blockquote><p>first</p><p>second</p></blockquote>")
    await editor.focus()
    await placeCaretOnQuoteElement(editor)
  })

  test("pasting a plain-text URL does not crash and creates a link inside the quote", async ({ editor }) => {
    await editor.paste("https://37signals.com")
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator('blockquote a[href="https://37signals.com"]')).toHaveCount(1)
    })
    expect(pageErrors).toHaveLength(0)
  })

  test("pasting a text/uri-list URL does not crash and creates a link inside the quote", async ({ editor }) => {
    await editor.paste(null, { uriList: "https://37signals.com" })
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator('blockquote a[href="https://37signals.com"]')).toHaveCount(1)
    })
    expect(pageErrors).toHaveLength(0)
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
