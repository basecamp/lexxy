import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Editor with an unregistered preset", () => {
  test("connects without crashing and warns about the unknown preset", async ({ page }) => {
    const pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error))

    const warnings = []
    page.on("console", (message) => {
      if (message.type() === "warning") warnings.push(message.text())
    })

    await page.goto("/unknown-preset.html")
    await page.waitForSelector("lexxy-editor[connected]")

    // It connected (no crash in connectedCallback) and falls back to defaults.
    await expect(page.locator("lexxy-editor")).toHaveAttribute("connected", "")

    expect(pageErrors, pageErrors.map((e) => e.stack).join("\n\n")).toHaveLength(0)
    expect(warnings.some((text) => text.includes('Unknown Lexxy preset "not-registered"'))).toBe(true)
  })
})
