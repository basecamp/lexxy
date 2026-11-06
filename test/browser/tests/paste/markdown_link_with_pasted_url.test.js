import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Paste — URL inside a Markdown link", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("pasting the URL of a Markdown link being typed keeps the link shortcut working", async ({ editor }) => {
    await editor.send("[this is a link](")
    await editor.paste("https://37signals.com")
    await editor.send(")")

    await assertEditorHtml(
      editor,
      '<p><a href="https://37signals.com">this is a link</a></p>',
    )
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("a")).toHaveCount(1)
      await expect(content.locator('a[href="https://37signals.com"]')).toHaveText("this is a link")
      await expect(content).not.toContainText("](")
    })
  })

  test("a URL pasted inside an unfinished Markdown link is plain text until the link is closed", async ({ editor }) => {
    await editor.locator.evaluate((el) => {
      el.addEventListener("lexxy:insert-link", () => { el.dataset.insertLinkEvents = String(Number(el.dataset.insertLinkEvents || 0) + 1) })
    })

    await editor.send("Read [the post](")
    await editor.paste("https://37signals.com")

    await assertEditorHtml(editor, "<p>Read [the post](https://37signals.com</p>")
    const insertLinkEvents = await editor.locator.evaluate((el) => Number(el.dataset.insertLinkEvents || 0))
    expect(insertLinkEvents).toBe(0)
  })

  test("a URL pasted after an ordinary parenthesis is still linked", async ({ editor }) => {
    await editor.send("See (")
    await editor.paste("https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>See (<a href="https://37signals.com">https://37signals.com</a></p>',
    )
  })
})
