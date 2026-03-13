import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../helpers/assertions.js"

test.describe("Paste", () => {
  test("convert to markdown on paste", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("Hello **there**")
    await assertEditorHtml(editor, "<p>Hello <b><strong>there</strong></b></p>")
  })

  test("create links when pasting URLs", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue("<p>Hello everyone</p>")

    await editor.select("everyone")
    await editor.paste("https://37signals.com")

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator('a[href="https://37signals.com"]'),
      ).toHaveText("everyone")
    })
  })

  test("keep content when pasting URLs", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue("<p>Hello everyone</p>")

    await editor.paste("https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Hello everyone<a href="https://37signals.com">https://37signals.com</a></p>',
    )
  })

  test("create links when pasting URLs keeps formatting", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue("<p>Hello everyone</p>")

    await editor.select("everyone")
    await editor.clickToolbarButton("bold")
    await editor.paste("https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Hello <a href="https://37signals.com"><b><strong>everyone</strong></b></a></p>',
    )
  })

  test("merge adjacent links when pasting URL over multiple words", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.send("Hello")
    await editor.flush()
    await editor.select("Hello")
    await editor.paste("https://37signals.com")
    await editor.flush()

    await editor.send("ArrowRight")
    await editor.send(" everyone")
    await editor.flush()

    await editor.selectAll()
    await editor.paste("https://37signals.com")

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator('a[href="https://37signals.com"]'),
      ).toHaveText("Hello everyone")
      await expect(
        content.locator('a[href="https://37signals.com"]'),
      ).toHaveCount(1)
      await expect(content.locator("a + a")).toHaveCount(0)
    })
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

  test("preserve single newlines as line breaks when pasting plain text", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("Line 1\nLine 2\nLine 3")
    await assertEditorHtml(editor, "<p>Line 1<br>Line 2<br>Line 3</p>")
  })

  test("preserve double newlines as separate paragraphs when pasting plain text", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("Paragraph 1\n\nParagraph 2")
    await assertEditorHtml(editor, "<p>Paragraph 1</p><p>Paragraph 2</p>")
  })

  test("don't convert markdown when disabled", async ({ page, editor }) => {
    await page.goto("/markdown-disabled.html")
    await editor.waitForConnected()

    await editor.click()
    await editor.paste("Hello **there**")
    await assertEditorHtml(editor, "<p>Hello **there**</p>")
  })
})
