import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

test.describe("Paste — Plain text paths and spacing", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("preserves a UNC path with consecutive spaces and backslashes", async ({ editor }) => {
    const path = "\\\\Arina-alvand\\alvand\\03 - ENGINEERING\\TN32 -NSC YAWATA\\00. Input\\00.Original\\2026-06-17"

    await editor.paste(path)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("a")).toHaveCount(0)
    })
    expect(await editor.plainTextValue()).toBe(path)
  })

  test("preserves runs of consecutive spaces in plain text", async ({ editor }) => {
    const text = "path  with    multiple   spaces"

    await editor.paste(text)

    expect(await editor.plainTextValue()).toBe(text)
  })

  test("still converts genuine markdown on paste", async ({ editor }) => {
    await editor.paste("Hello **there**")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("strong")).toHaveText("there")
    })
  })
})
