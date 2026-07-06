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

  test("Control+Shift+F10 also moves focus to the first table tool", async ({ page, editor }) => {
    await page.keyboard.press("Control+Shift+F10")

    await expect(
      editor.locator.locator("lexxy-table-tools button[aria-label='Remove row']").first()
    ).toBeFocused()
  })

  test("arrow keys move focus between table tools", async ({ page, editor }) => {
    await page.keyboard.press("Alt+F10")
    await page.keyboard.press("ArrowRight")

    await expect(
      editor.locator.locator("lexxy-table-tools .lexxy-table-control--row summary")
    ).toBeFocused()
  })

  test("Escape returns focus to the table", async ({ page, editor }) => {
    await page.keyboard.press("Alt+F10")
    await page.keyboard.press("Escape")

    await expect(editor.content).toBeFocused()
  })
})
