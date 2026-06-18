import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("@ inserted before an existing word", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-filtering.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("filters by the word that follows the trigger", async ({ page, editor }) => {
    await editor.send("Jack")
    await editor.send("Home")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveCount(2)

    const names = await items.allTextContents()
    expect(names).toEqual([ "Jack Franklin", "Clara Jackson" ])
  })

  test("replaces the trigger and the following word with the selected mention", async ({ page, editor }) => {
    await editor.send("Jack")
    await editor.send("Home")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.send("Enter")
    await editor.flush()

    await expect(popover).not.toBeVisible()
    expect(await editor.plainTextValue()).toContain("Jack Franklin")
    expect(await editor.plainTextValue()).not.toContain("@")
  })
})
