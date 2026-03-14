import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../../helpers/assertions.js"

test.describe("Paste — Links", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("create links when pasting URLs", async ({ page, editor }) => {
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
    await editor.setValue("<p>Hello everyone</p>")

    await editor.select("everyone")
    await editor.clickToolbarButton("bold")
    await editor.paste("https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Hello <a href="https://37signals.com"><strong>everyone</strong></a></p>',
    )
  })

  test("merge adjacent links when pasting URL over multiple words", async ({
    page,
    editor,
  }) => {
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
})
