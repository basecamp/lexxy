import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt activation is gated on data-permitted-attachment-types", () => {
  test("prompt does not activate when its content-type is not in the editor's allowlist", async ({ page, editor }) => {
    await page.goto("/prompt-disallowed-content-type.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toHaveCount(0)
  })

  test("prompt activates normally when its content-type is in the editor's allowlist", async ({ page, editor }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })
  })

  test("prompt does not activate when editor has attachments=\"false\"", async ({ page, editor }) => {
    await page.goto("/prompt-attachments-false.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toHaveCount(0)
  })
})
