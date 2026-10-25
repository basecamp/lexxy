import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Escape from the main toolbar", () => {
  for (const name of [ "bold", "format", "highlight", "link" ]) {
    test(`Escape keeps focus on ${name} when no dropdown is open`, async ({ page, editor }) => {
      await page.goto("/")
      await page.waitForSelector("lexxy-toolbar[connected]")
      await editor.setValue("<p>Hello everyone</p>")
      await editor.content.click()
      await editor.flush()
      await page.keyboard.press("Shift+Tab")

      const button = page.locator(`lexxy-toolbar button[name='${name}']`)
      for (let step = 0; step < 20 && !(await button.evaluate(element => element === document.activeElement)); step++) {
        await page.keyboard.press("ArrowRight")
      }
      await expect(button).toBeFocused()

      await page.keyboard.press("Escape")
      await expect(button).toBeFocused()
    })
  }
})
