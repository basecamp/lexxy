import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../helpers/assertions.js"

test.describe("Paste rendered content", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("preserves link URLs when pasting HTML with anchors", async ({
    editor,
  }) => {
    const html =
      '<p>Check out <a href="https://example.com/page">this page</a> for details</p>'

    await editor.paste("Check out this page for details", { html })

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator('a[href="https://example.com/page"]'),
      ).toHaveText("this page")
    })
  })

  test("converts fragment-only anchors to plain text", async ({ editor }) => {
    // When copying from rendered views, mentions and other interactive elements
    // are often wrapped in <a href="#"> tags. These should be pasted as plain
    // text since "#" is not a meaningful URL.
    const html = '<p>Hey <a href="#">@Jorge</a>, check this out</p>'

    await editor.paste("Hey @Jorge, check this out", { html })

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("a")).toHaveCount(0)
      await expect(content).toContainText("Hey @Jorge, check this out")
    })
  })

  test("preserves real links but strips fragment-only anchors in mixed content", async ({
    editor,
  }) => {
    const html = [
      "<p>Hey <a href=\"#\">@Jorge</a>, check out ",
      '<a href="https://example.com">this link</a>',
      " when you get a chance</p>",
    ].join("")

    await editor.paste(
      "Hey @Jorge, check out this link when you get a chance",
      { html },
    )

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator('a[href="https://example.com"]'),
      ).toHaveText("this link")
      await expect(content.locator('a[href="#"]')).toHaveCount(0)
      await expect(content).toContainText("@Jorge")
    })
  })

  test("strips empty-href anchors from pasted content", async ({ editor }) => {
    const html = '<p>Hello <a href="">world</a></p>'

    await editor.paste("Hello world", { html })

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("a")).toHaveCount(0)
      await expect(content).toContainText("Hello world")
    })
  })
})
