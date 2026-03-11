import { expect } from "@playwright/test"
import { normalizeHtml } from "./html.js"

// Assert editor HTML value matches expected (with retries + normalization).
export async function assertEditorHtml(editor, expected) {
  await expect
    .poll(
      async () => {
        await editor.flush()
        return normalizeHtml(await editor.value())
      },
      { timeout: 5_000 },
    )
    .toBe(normalizeHtml(expected))
}

// Assert against the editor's content element using a callback with Playwright locator assertions.
// Usage: await assertEditorContent(editor, async (content) => { await expect(content.locator('a')).toHaveText('link') })
export async function assertEditorContent(editor, assertionFn) {
  await editor.flush()
  await assertionFn(editor.content)
}

// Assert editor plain text value.
export async function assertEditorPlainText(editor, expected) {
  await expect
    .poll(
      async () => {
        await editor.flush()
        return await editor.plainTextValue()
      },
      { timeout: 5_000 },
    )
    .toBe(expected)
}

// Assert table structure inside the editor.
export async function assertEditorTableStructure(editor, cols, rows) {
  await editor.flush()
  await expect(editor.content.locator("table tr")).toHaveCount(rows)
  await expect(
    editor.content.locator("table tr").first().locator("td, th"),
  ).toHaveCount(cols)
}
