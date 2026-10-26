import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt keyboard navigation", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/mentions-large.html")
    await editor.waitForConnected()
  })

  test("arrow keys wrap around the ends of the list", async ({ page, editor }) => {
    await editor.send("@")
    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible()

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items.first()).toHaveAttribute("aria-selected")

    await editor.send("ArrowUp")
    await expect(items.last()).toHaveAttribute("aria-selected")
    await expect(popover.locator("[aria-selected]")).toHaveCount(1)

    await editor.send("ArrowDown")
    await expect(items.first()).toHaveAttribute("aria-selected")
    await expect(popover.locator("[aria-selected]")).toHaveCount(1)
  })

  test("scrolling keeps the neighbouring option in view", async ({ page, editor }) => {
    await editor.send("@")
    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible()

    for (let i = 0; i < 10; i++) await editor.send("ArrowDown")
    await expect(popover.locator(".lexxy-prompt-menu__item").nth(10)).toHaveAttribute("aria-selected")

    await expect.poll(() => popover.evaluate((menu) => {
      const next = menu.querySelector("[aria-selected]").nextElementSibling
      return next.getBoundingClientRect().bottom <= menu.getBoundingClientRect().bottom
    })).toBe(true)

    for (let i = 0; i < 21; i++) await editor.send("ArrowUp")
    const items = popover.locator(".lexxy-prompt-menu__item")
    const lastIndex = await items.count() - 1
    await expect(items.nth(lastIndex - 10)).toHaveAttribute("aria-selected")

    await expect.poll(() => popover.evaluate((menu) => {
      const previous = menu.querySelector("[aria-selected]").previousElementSibling
      return previous.getBoundingClientRect().top >= menu.getBoundingClientRect().top
    })).toBe(true)
  })
})
