import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt empty-results", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prompt-empty-results.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("renders empty-results attribute as text, not HTML", async ({ page, editor }) => {
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.content.pressSequentially("zzznomatch")
    await editor.flush()

    const emptyItem = popover.locator(".lexxy-prompt-menu__item--empty")
    await expect(emptyItem).toBeVisible({ timeout: 5_000 })

    // No HTML elements injected from the attribute value
    await expect(emptyItem.locator("img")).toHaveCount(0)
    await expect(emptyItem.locator("b")).toHaveCount(0)

    // The whole attribute is rendered verbatim as text
    await expect(emptyItem).toHaveText(
      '<img src="x" data-payload="injected" onerror="window.__xss = true">No match for <b>literal</b>'
    )

    // The injected onerror handler did not execute
    const xssFired = await page.evaluate(() => window.__xss === true)
    expect(xssFired).toBe(false)
  })
})
