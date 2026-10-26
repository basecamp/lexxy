import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Plain text", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/rich-text-disabled.html")
    await editor.waitForConnected()
  })

  test("markdown conversion on paste disabled in plain-text mode", async ({
    editor,
  }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("Hello")
    await editor.paste("**Hello**")

    await assertEditorHtml(editor, "<p>**Hello** everyone</p>")
  })

  test("formatting shortcuts disabled in plain-text mode", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("Hello")

    await page.keyboard.press("Control+b")

    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("no toolbar in plaintext mode", async ({ page }) => {
    await expect(page.locator("lexxy-toolbar")).toHaveCount(0)
  })
})
