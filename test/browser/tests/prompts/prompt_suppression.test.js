import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt activation is gated on permitted-attachment-types", () => {
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

  test("prompt activates when any template resolves to a permitted content-type, including templates without an explicit content-type attribute", async ({ page, editor }) => {
    await page.goto("/prompt-mixed-templates.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })
  })

  test("insert-editable-text prompt activates even when its content-type is not in the editor's allowlist", async ({ page }) => {
    await page.goto("/prompt-insert-editable-text-bypasses-content-type.html")
    const editorElement = page.locator("[data-editor='restricted-allowlist'] lexxy-editor")
    await editorElement.waitFor({ state: "attached" })
    await page.waitForSelector("[data-editor='restricted-allowlist'] lexxy-editor[connected]")

    await editorElement.locator(".lexxy-editor__content").click()
    await page.keyboard.type("!")

    const popover = page.locator("[data-editor='restricted-allowlist'] .lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })
  })

  test("insert-editable-text prompt activates even when the editor has attachments=\"false\"", async ({ page }) => {
    await page.goto("/prompt-insert-editable-text-bypasses-content-type.html")
    const editorElement = page.locator("[data-editor='attachments-false'] lexxy-editor")
    await editorElement.waitFor({ state: "attached" })
    await page.waitForSelector("[data-editor='attachments-false'] lexxy-editor[connected]")

    await editorElement.locator(".lexxy-editor__content").click()
    await page.keyboard.type("!")

    const popover = page.locator("[data-editor='attachments-false'] .lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })
  })
})
