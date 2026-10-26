import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Emphasis inside blockquotes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("renders emphasized text upright inside an italic blockquote", async ({ editor }) => {
    await editor.setValue("<blockquote><p>Quoted <em>emphasized</em> text</p></blockquote>")
    await editor.flush()

    const paragraph = editor.content.locator("blockquote p")
    const emphasis = editor.content.locator("blockquote em")

    await expect(paragraph).toHaveCSS("font-style", "italic")
    await expect(emphasis).toHaveCSS("font-style", "normal")
  })

  test("renders bold emphasized text upright inside an italic blockquote", async ({ editor }) => {
    await editor.setValue("<blockquote><p>Quoted <strong><em>emphasized</em></strong> text</p></blockquote>")
    await editor.flush()

    const paragraph = editor.content.locator("blockquote p")
    const emphasis = editor.content.locator("blockquote .lexxy-content__italic")

    await expect(paragraph).toHaveCSS("font-style", "italic")
    await expect(emphasis).toHaveCSS("font-style", "normal")
  })
})
