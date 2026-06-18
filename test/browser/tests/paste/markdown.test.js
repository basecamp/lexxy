import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../../helpers/assertions.js"

test.describe("Paste — Markdown", () => {
  test("convert to markdown on paste", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("Hello **there**")
    await assertEditorHtml(editor, "<p>Hello <strong>there</strong></p>")
  })

  test("don't convert markdown when pasting into code block", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("some text")
    await editor.clickToolbarButton("insertCodeBlock")
    await editor.paste("Hello **there**")

    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText("**there**")
      await expect(content.locator("strong")).toHaveCount(0)
    })
  })

  test("don't convert markdown when disabled", async ({ page, editor }) => {
    await page.goto("/markdown-disabled.html")
    await editor.waitForConnected()

    await editor.click()
    await editor.paste("Hello **there**")
    await assertEditorHtml(editor, "<p>Hello **there**</p>")
  })

  test("preserves runs of consecutive spaces when pasting plain text", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    const asciiTable = [
      "+--------+--------+--------+",
      "| Name   | Score  | Level  |",
      "+--------+--------+--------+",
      "| Alice  |   87   |   3    |",
      "| Bob    |   42   |   7    |",
      "| Clara  |   65   |   5    |",
      "+--------+--------+--------+",
    ].join("\n")

    await editor.paste(asciiTable)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      // textContent normalizes NBSPs to regular-space-equivalents for the
      // visible text, so each row should round-trip with its column padding.
      const text = await content.evaluate((el) =>
        el.innerText.replace(/ /g, " "),
      )
      expect(text).toContain("| Alice  |   87   |   3    |")
      expect(text).toContain("| Bob    |   42   |   7    |")
      expect(text).toContain("| Clara  |   65   |   5    |")
    })
  })
})
