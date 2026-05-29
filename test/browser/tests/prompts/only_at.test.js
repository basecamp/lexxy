import { test } from "../../test_helper.js"
import { EditorHandle } from "../../helpers/editor_handle.js"
import { expect } from "@playwright/test"

test.describe("Prompt only-at attribute", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prompt-only-at.html")
  })

  test("only-at=\"^\" opens the prompt at the very start of the document", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='start-of-input'] lexxy-editor")
    await editor.waitForConnected()
    const popover = page.locator("[data-editor='start-of-input'] .lexxy-prompt-menu--visible")

    await editor.send("!")
    await expect(popover).toBeVisible({ timeout: 5_000 })
  })

  test("only-at=\"^\" does not open the prompt after other text", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='start-of-input'] lexxy-editor")
    await editor.waitForConnected()
    const popover = page.locator("[data-editor='start-of-input'] .lexxy-prompt-menu--visible")

    await editor.send("hello ")
    await editor.send("!")
    await expect(popover).toHaveCount(0)
  })

  test("only-at=\"^\" does not open the prompt at the start of a later paragraph", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='start-of-input'] lexxy-editor")
    await editor.waitForConnected()
    const popover = page.locator("[data-editor='start-of-input'] .lexxy-prompt-menu--visible")

    await editor.send("hello")
    await editor.send("Enter")
    await editor.send("!")
    await expect(popover).toHaveCount(0)
  })

  test("only-at=\".*\" opens the prompt in the middle of a word", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='anywhere'] lexxy-editor")
    await editor.waitForConnected()
    const popover = page.locator("[data-editor='anywhere'] .lexxy-prompt-menu--visible")

    await editor.send("email")
    await editor.send("#")
    await expect(popover).toBeVisible({ timeout: 5_000 })
  })

  test("default behavior: does not open the prompt mid-word when only-at is not set", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='default'] lexxy-editor")
    await editor.waitForConnected()
    const popover = page.locator("[data-editor='default'] .lexxy-prompt-menu--visible")

    await editor.send("hello")
    await editor.send("@")
    await expect(popover).toHaveCount(0)
  })

  test("default behavior: opens after a space when only-at is not set", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='default'] lexxy-editor")
    await editor.waitForConnected()
    const popover = page.locator("[data-editor='default'] .lexxy-prompt-menu--visible")

    await editor.send("hello ")
    await editor.send("@")
    await expect(popover).toBeVisible({ timeout: 5_000 })
  })

  test("default behavior: opens at the start of a later paragraph", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='default'] lexxy-editor")
    await editor.waitForConnected()
    const popover = page.locator("[data-editor='default'] .lexxy-prompt-menu--visible")

    await editor.send("hello")
    await editor.send("Enter")
    await editor.send("@")
    await expect(popover).toBeVisible({ timeout: 5_000 })
  })
})
