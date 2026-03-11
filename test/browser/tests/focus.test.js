import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../helpers/assertions.js"

test.describe("Focus", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/new")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("focus the editor", async ({ editor }) => {
    await editor.focus()
    await expect(editor.content).toBeFocused()
  })

  test("text after focus doesn't add new line", async ({ editor }) => {
    await editor.focus()
    await editor.send("Hello there")

    await assertEditorHtml(editor, "<p>Hello there</p>")
  })

  test("autofocus attribute", async ({ page, editor }) => {
    await page.goto("/posts/new?autofocus=true")
    await editor.waitForConnected()

    await expect(editor.content).toBeFocused()
  })
})
