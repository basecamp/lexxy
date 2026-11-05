import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test("ArrowDown from the line above a table inserted from the keyboard lands in the header row", async ({ page, editor }) => {
  await page.goto("/")
  await editor.waitForConnected()
  await editor.content.click()
  await page.keyboard.type("Before the table")
  await page.keyboard.press("Shift+Tab")

  const tableButton = page.locator("lexxy-toolbar button[data-command='insertTable']")
  for (let index = 0; index < 20 && !(await tableButton.evaluate(element => element === document.activeElement)); index++) {
    await page.keyboard.press("ArrowRight")
  }
  await expect(tableButton).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(editor.content.locator("table")).toHaveCount(1)
  await page.keyboard.press("Tab")
  await expect(editor.content).toBeFocused()

  await page.keyboard.press("ArrowDown")
  await page.keyboard.type("A1")

  await expect(editor.content.locator("table tr").nth(0).locator("th, td").nth(0)).toHaveText("A1")
  await expect(editor.content.locator("table tr").nth(1)).not.toContainText("A1")
})
