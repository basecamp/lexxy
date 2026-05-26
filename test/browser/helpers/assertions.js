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

// Monitor uncaught page errors and console errors. Errors are stashed per-page;
// assert with `expect(page).toHaveNoErrors()`.
//
// Usage:
//   startMonitoringConsole(page)
//   // ... interact with the page ...
//   expect(page).toHaveNoErrors()
const consoleErrors = new WeakMap()

export function startMonitoringConsole(page) {
  const errors = []
  consoleErrors.set(page, errors)
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
}

expect.extend({
  toHaveNoErrors(page) {
    if (!consoleErrors.has(page)) {
      return {
        pass: false,
        message: () => "expected page to have no errors, but startMonitoringConsole(page) was never called",
      }
    }
    const errors = consoleErrors.get(page)
    if (errors.length === 0) {
      return {
        pass: true,
        message: () => "expected page to have errors, but none were captured",
      }
    }
    const list = errors.map((error, index) => `  ${index + 1}. ${error}`).join("\n")
    return {
      pass: false,
      message: () => `expected no page errors, but ${errors.length} were captured:\n${list}`,
    }
  },
})
