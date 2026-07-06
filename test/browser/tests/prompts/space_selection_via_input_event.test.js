import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt selection via input event (Android soft keyboard)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("selects the highlighted option when an input event with insertText ' ' fires", async ({ page, editor }) => {
    await editor.send("Hello @")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    // Simulate the Android soft-keyboard path: an input event without a
    // matching keydown. Lexical maps this to INPUT_COMMAND, which the prompt
    // listens to in order to select the highlighted option. We deliberately
    // avoid pressing Space (which would also fire KEY_SPACE_COMMAND and mask
    // the regression).
    await editor.content.evaluate((el) => {
      el.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: false,
        inputType: "insertText",
        data: " ",
      }))
    })
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toBeVisible({ timeout: 5_000 })
    await expect(popover).toBeHidden()
  })
})
