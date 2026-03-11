import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import {
  assertEditorHtml,
  assertEditorContent,
} from "../helpers/assertions.js"

test.describe("Load HTML", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/new")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("load simple string", async ({ editor }) => {
    await editor.setValue("Hello")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("p")).toHaveText("Hello")
    })
  })

  test("normalize loaded HTML", async ({ editor }) => {
    await editor.setValue("<div>hello</div> <div>there</div>")
    await assertEditorHtml(editor, "<p>hello</p><p>there</p>")
  })
})
