import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Tables — Toolbar accessibility", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await editor.clickToolbarButton("insertTable")
    await editor.content.locator("table th").first().click()
  })

  test("Alt+F10 moves focus to the first table tool", async ({ page, editor }) => {
    await page.keyboard.press("Alt+F10")

    await expect(
      editor.locator.locator("lexxy-table-tools button[aria-label='Remove row']").first()
    ).toBeFocused()
  })

  test("Alt+F10 shows a visible focus ring on the first table tool", async ({ page, editor }) => {
    await page.keyboard.press("Alt+F10")

    const firstTool = editor.locator.locator("lexxy-table-tools button[aria-label='Remove row']").first()
    await expect(firstTool).toBeFocused()
    await expect.poll(() => firstTool.evaluate(element => element.matches(":focus-visible"))).toBe(true)
  })

  test("arrow keys move focus between table tools", async ({ page, editor }) => {
    await page.keyboard.press("Alt+F10")
    await page.keyboard.press("ArrowRight")

    await expect(
      editor.locator.locator("lexxy-table-tools .lexxy-table-control--row [data-dropdown-trigger]")
    ).toBeFocused()
  })

  test("Escape returns focus to the table", async ({ page, editor }) => {
    await page.keyboard.press("Alt+F10")
    await page.keyboard.press("Escape")

    await expect(editor.content).toBeFocused()
  })

  test("the more menu exposes menu semantics", async ({ editor }) => {
    const trigger = editor.locator.locator("lexxy-table-tools .lexxy-table-control--row [data-dropdown-trigger]")
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    await expect(trigger).toHaveAttribute("aria-expanded", "false")

    await trigger.click()
    await expect(trigger).toHaveAttribute("aria-expanded", "true")

    const menu = editor.locator.locator("lexxy-table-tools .lexxy-table-control--row [data-dropdown-panel]")
    await expect(menu).toHaveAttribute("role", "menu")
    await expect(menu.locator("button[role='menuitem']")).toHaveCount(4)
  })

  test("arrow keys stay within the open more menu and wrap", async ({ page, editor }) => {
    await editor.openTableRowMenu()

    const items = editor.locator.locator("lexxy-table-tools .lexxy-table-control--row [data-dropdown-panel] button[role='menuitem']")
    await expect(items.first()).toBeFocused()

    await page.keyboard.press("ArrowUp")
    await expect(items.last()).toBeFocused()

    await page.keyboard.press("ArrowDown")
    await expect(items.first()).toBeFocused()

    await page.keyboard.press("ArrowDown")
    await expect(items.nth(1)).toBeFocused()
  })

  test("Escape closes the more menu and returns focus to its trigger", async ({ page, editor }) => {
    const trigger = editor.locator.locator("lexxy-table-tools .lexxy-table-control--row [data-dropdown-trigger]")
    await trigger.focus()
    await page.keyboard.press("Enter")

    const menu = editor.locator.locator("lexxy-table-tools .lexxy-table-control--row [data-dropdown-panel]")
    await expect(menu).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test("opening the more menu with the mouse shows a focus ring on the first item", async ({ editor }) => {
    await editor.openTableRowMenu()

    const firstItem = editor.locator.locator("lexxy-table-tools .lexxy-table-control--row [data-dropdown-panel] button[role='menuitem']").first()
    await expect(firstItem).toBeFocused()
    await expect.poll(() => firstItem.evaluate(element => element.matches(":focus-visible"))).toBe(true)
  })

  test("activating a more menu action returns focus to the editor", async ({ page, editor }) => {
    await editor.openTableRowMenu()
    await page.keyboard.press("Enter")

    await expect.poll(() => editor.isFocused()).toBe(true)
  })
})
