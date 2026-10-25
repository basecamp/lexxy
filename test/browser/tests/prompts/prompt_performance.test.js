import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt performance with large lists", () => {
  test.describe.configure({ mode: "serial" })

  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-large.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("caps the number of rendered suggestions", async ({ page, editor }) => {
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    // With 200 matching items, the popover should cap rendered items at 100
    const itemCount = await popover.locator(".lexxy-prompt-menu__item").count()
    expect(itemCount).toBeLessThanOrEqual(100)
    expect(itemCount).toBeGreaterThan(0)
  })

  test("filtering narrows results within the cap", async ({ page, editor }) => {
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    // Type a numeric filter to narrow results without triggering space-select.
    // "19" matches "Person 19", "Person 190"-"Person 199" = 11 items
    await editor.content.pressSequentially("19")
    await editor.flush()

    // Wait for debounce to settle and results to update
    await page.waitForTimeout(200)

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items.first()).toBeVisible({ timeout: 2_000 })

    const itemCount = await items.count()
    expect(itemCount).toBeGreaterThan(0)
    expect(itemCount).toBeLessThan(100)
  })
})
