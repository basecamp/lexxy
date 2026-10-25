import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml } from "../../helpers/assertions.js"

// Notepad and other Windows editors put text/plain on the clipboard with CRLF
// line endings and no text/html flavor at all.
test.describe("Paste — Windows plain text", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("keeps CRLF line endings as single line breaks", async ({ editor }) => {
    await editor.paste("first line\r\nsecond line")

    await assertEditorHtml(editor, "<p>first line<br>second line</p>")
  })

  test("keeps an indented outline as text instead of a code block", async ({ editor }) => {
    const outline = [
      "\tBACKUPS",
      "\t\tContinued optimizations.",
      "CYBERSECURITY",
      "\tHIBP",
    ].join("\r\n")

    await editor.paste(outline)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toHaveCount(0)
    })
    expect(await editor.plainTextValue()).toBe(outline.replaceAll("\r\n", "\n"))
  })

  test("keeps a space-indented outline as text instead of a code block", async ({ editor }) => {
    const outline = "REQUESTS\r\n    NAC\r\n        FLOYD"

    await editor.paste(outline)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toHaveCount(0)
    })
    expect(await editor.plainTextValue()).toBe(outline.replaceAll("\r\n", "\n"))
  })

  test("keeps an indented paragraph after a blank line out of a code block", async ({ editor }) => {
    await editor.paste("CYBERSECURITY\r\n\r\n\tGENERAL\r\n\t\tARC")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toHaveCount(0)
      await expect(content).toContainText("GENERAL")
      await expect(content).toContainText("ARC")
    })
  })

  test("still converts a fenced code block", async ({ editor }) => {
    await editor.paste("```\r\nputs 'hello'\r\n```")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toHaveCount(1)
      await expect(content.locator("code")).toContainText("puts 'hello'")
    })
  })

  test("still converts an indented nested list", async ({ editor }) => {
    await editor.paste("- one\r\n    - nested\r\n- two")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("ul ul li")).toHaveText([ "nested" ])
      await expect(content.locator("code")).toHaveCount(0)
    })
  })
})
