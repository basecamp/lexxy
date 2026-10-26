import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml } from "../../helpers/assertions.js"

// Browsers can place the caret on the blockquote element itself — an element point on the
// QuoteNode — e.g. when clicking the gap between two paragraphs inside a quote. Lexical's
// RangeSelection.insertNodes requires every selection point to have a block ancestor with
// inline children; a quote holding paragraphs has none, so pasting at that caret crashed
// with Lexical error #211 (inline content) or #212 (block content) and lost the pasted content.
test.describe("Paste with the caret on a quote element", () => {
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

  test("pasting inline content does not crash and lands inside the quote", async ({ editor }) => {
    await editor.paste("pasted", { html: "<span>pasted</span>" })
    await editor.flush()

    expect(pageErrors).toHaveLength(0)
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toContainText("pasted")
    })
    await assertEditorHtml(editor, "<blockquote><p>first</p><p>pastedsecond</p></blockquote>")
  })

  test("pasting block content does not crash and is preserved", async ({ editor }) => {
    await editor.paste("pasted one\npasted two", { html: "<p>pasted one</p><p>pasted two</p>" })
    await editor.flush()

    expect(pageErrors).toHaveLength(0)
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toContainText("pasted one")
      await expect(content.locator("blockquote")).toContainText("pasted two")
    })
  })

  // A second consumer hit the same crash from a different entry point: a plain-text markdown
  // paste (Clipboard#pasteMarkdown → Contents#insertDOM → insertAtCursor → insertNodes). Pasting
  // text without an HTML payload routes through the markdown path, which produces block content
  // and reproduced the #212 variant. See https://github.com/basecamp/lexxy/pull/1109.
  test("pasting markdown does not crash and lands inside the quote", async ({ editor }) => {
    await editor.paste("pasted markdown")
    await editor.flush()

    expect(pageErrors).toHaveLength(0)
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toContainText("pasted markdown")
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
