import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../../helpers/assertions.js"

// VS Code (and editors built on it, such as Cursor) copies syntax-highlighted HTML next to the
// plain text, plus a vscode-editor-data entry naming the language of the file it came from.
function vsCodeClipboard(lines, mode) {
  const lineHtml = lines.map((line) => line ? `<div><span style="color: #cccccc;">${escapeHtml(line)}</span></div>` : "<br>").join("")

  return {
    html: `<meta charset='utf-8'><div style="color: #cccccc;background-color: #1f1f1f;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;">${lineHtml}</div>`,
    data: {
      "vscode-editor-data": JSON.stringify({ version: 1, isFromEmptySelection: false, multicursorText: null, mode })
    }
  }
}

function escapeHtml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

test.describe("Paste — from a code editor", () => {
  test("convert Markdown copied from a Markdown file", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    const lines = [ "> Quoted **bold** line", "", "- one", "- two" ]
    await editor.paste(lines.join("\n"), vsCodeClipboard(lines, "markdown"))

    await assertEditorHtml(
      editor,
      "<blockquote><p>Quoted <strong>bold</strong> line</p></blockquote><ul><li value=\"1\">one</li><li value=\"2\">two</li></ul>",
    )
  })

  test("convert Markdown copied from a plain text file", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    const lines = [ "Hello **there**" ]
    await editor.paste(lines.join("\n"), vsCodeClipboard(lines, "plaintext"))

    await assertEditorHtml(editor, "<p>Hello <strong>there</strong></p>")
  })

  test("keep code copied from a source file as a code block", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    const lines = [ "const answer = 42", "console.log(answer)" ]
    await editor.paste(lines.join("\n"), vsCodeClipboard(lines, "javascript"))

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toHaveCount(1)
      await expect(content.locator("code")).toContainText("const answer = 42")
    })
  })

  test("paste a Markdown file's text verbatim when Markdown is disabled", async ({ page, editor }) => {
    await page.goto("/markdown-disabled.html")
    await editor.waitForConnected()

    await editor.click()
    const lines = [ "Hello **there**" ]
    await editor.paste(lines.join("\n"), vsCodeClipboard(lines, "markdown"))

    await assertEditorHtml(editor, "<p>Hello **there**</p>")
  })
})
