import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Mention filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-filtering.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("matches only at word boundaries and orders by first match position", async ({ page, editor }) => {
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.content.pressSequentially("ja")
    await page.waitForTimeout(200)

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveCount(4)

    const names = await items.allTextContents()
    expect(names).toEqual([
      "Jack Franklin",
      "Jason Clack",
      "Clara Jackson",
      "Thomas Jaiden",
    ])
  })

  test("does not match filter in the middle of a word", async ({ page, editor }) => {
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.content.pressSequentially("mid")
    await page.waitForTimeout(200)

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveCount(0)
  })
})
