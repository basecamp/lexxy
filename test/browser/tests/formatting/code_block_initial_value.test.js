import { expect } from "@playwright/test"
import { test } from "../../test_helper.js"

test.describe("Code block loaded as initial value", () => {
  test("highlights syntax on load without user interaction", async ({ page, editor }) => {
    await page.goto("/initial-value-code-block.html")
    await editor.waitForConnected()

    const codeBlock = editor.content.locator('code[data-language="css"]')
    await expect(codeBlock).toBeAttached()

    const tokens = codeBlock.locator('[class*="code-token"]')
    await expect(tokens.first()).toBeAttached()
  })
})
