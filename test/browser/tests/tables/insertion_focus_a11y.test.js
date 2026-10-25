import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test("keyboard table insertion highlights a cell only once the caret enters it", async ({ page, editor }) => {
  await page.goto("/")
  await editor.waitForConnected()
  await editor.content.click()
  await page.keyboard.press("Shift+Tab")

  const tableButton = page.locator("lexxy-toolbar button[data-command='insertTable']")
  for (let index = 0; index < 20 && !(await tableButton.evaluate(element => element === document.activeElement)); index++) {
    await page.keyboard.press("ArrowRight")
  }
  await expect(tableButton).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(editor.content.locator("table")).toHaveCount(1)
  await expect(tableButton).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(editor.content).toBeFocused()
  const focusedCell = editor.content.locator(".lexxy-content__table-cell--focus")
  await expect(focusedCell).toHaveCount(0)
  await page.keyboard.press("ArrowDown")
  await expect(focusedCell).toHaveCount(1)
  await expect.poll(() => focusedCell.evaluate(cell => cell.contains(document.getSelection().anchorNode))).toBe(true)
})
