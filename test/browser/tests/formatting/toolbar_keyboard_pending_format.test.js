import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Formatting from the keyboard toolbar, then Tab back", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.content.click()
  })

  test("Bold at a collapsed caret applies to what is typed next", async ({ page, editor }) => {
    await page.keyboard.type("Plain ")
    await activateBoldFromKeyboardAndReturn(page, editor)

    await page.keyboard.type("bold")

    await expect(editor.content.locator("strong")).toHaveText("bold")
  })
})

async function activateBoldFromKeyboardAndReturn(page, editor) {
  await page.keyboard.press("Shift+Tab")

  const boldButton = page.locator("lexxy-toolbar button[name='bold']")
  for (let index = 0; index < 20 && !(await boldButton.evaluate(element => element === document.activeElement)); index++) {
    await page.keyboard.press("ArrowRight")
  }
  await expect(boldButton).toBeFocused()
  await page.keyboard.press("Enter")
  await page.keyboard.press("Tab")
  await expect(editor.content).toBeFocused()
}
