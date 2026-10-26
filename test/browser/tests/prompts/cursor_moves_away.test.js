import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt dismissal when the cursor moves away from the trigger", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("closes the popover when the cursor moves after the trigger token", async ({ page, editor }) => {
    await editor.send("Hello there")
    await editor.send("Home")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await page.keyboard.press("End")
    await editor.flush()

    await expect(popover).toHaveCount(0)
  })

  test("closes the popover when the cursor moves before the trigger token", async ({ page, editor }) => {
    await editor.send("Hello there")
    await editor.send("Home")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await page.keyboard.press("ArrowLeft")
    await editor.flush()

    await expect(popover).toHaveCount(0)
  })
})
