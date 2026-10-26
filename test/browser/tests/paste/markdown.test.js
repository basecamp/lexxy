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

  test("keep blank lines between paragraphs in a blockquote as separate paragraphs", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste(
      "> First paragraph of the quote.\n>\n> Second paragraph of the quote.",
    )

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toHaveCount(1)
      await expect(content.locator("blockquote > p")).toHaveCount(2)
      await expect(content.locator("blockquote > p").nth(0)).toHaveText(
        "First paragraph of the quote.",
      )
      await expect(content.locator("blockquote > p").nth(1)).toHaveText(
        "Second paragraph of the quote.",
      )
    })
  })

  test("addBlockSpacing keeps the gap between paragraphs inside a blockquote", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await page.evaluate(() => {
      document
        .querySelector("lexxy-editor")
        .addEventListener("lexxy:insert-markdown", (event) => {
          event.detail.addBlockSpacing()
        })
    })

    await editor.paste(
      "> First paragraph of the quote.\n>\n> Second paragraph of the quote.",
    )

    await assertEditorHtml(
      editor,
      "<blockquote><p>First paragraph of the quote.</p><p><br></p><p>Second paragraph of the quote.</p></blockquote>",
    )
  })
})
