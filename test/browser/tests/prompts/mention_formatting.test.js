import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Mentions preserve earlier formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("inserting a mention does not apply the first word's format to plain text before it", async ({ page, editor }) => {
    await editor.setValue("<p><em>Italics</em> not applied to words other than the first</p>")
    await editor.focus()
    await editor.send("End")
    await editor.send(" ")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.send("Enter")
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toBeVisible({ timeout: 5_000 })

    // Only the first word ("Italics") should remain italic. The plain text that
    // follows it must not inherit the italic format after inserting the mention.
    const italicTexts = await editor.content.evaluate((el) => {
      return Array.from(el.querySelectorAll("em, i")).map((node) => node.textContent.trim())
    })

    expect(italicTexts).toEqual([ "Italics" ])
  })
})
