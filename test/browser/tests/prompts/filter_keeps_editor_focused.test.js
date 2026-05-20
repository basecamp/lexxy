import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt filter focus", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-filtering.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  // Android IMEs tear the soft keyboard down on any focus shift, so per-keystroke focus moves to a <li> and back dismiss-and-reopen the keyboard on every character.
  test("typing into the filter keeps focus on the editor", async ({ page, editor }) => {
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    const editorIsActive = () =>
      editor.content.evaluate((el) => document.activeElement === el)

    expect(await editorIsActive()).toBe(true)

    await editor.content.pressSequentially("j")
    await editor.flush()
    expect(await editorIsActive()).toBe(true)

    // Catches once-only side effects on subsequent keystrokes
    await editor.content.pressSequentially("a")
    await editor.flush()
    expect(await editorIsActive()).toBe(true)
  })

  test("aria-activedescendant points to the currently selected option", async ({ page, editor }) => {
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.content.pressSequentially("ja")
    await editor.flush()

    const activeMatches = await editor.content.evaluate((el) => {
      const id = el.getAttribute("aria-activedescendant")
      if (!id) return false
      const option = document.getElementById(id)
      return option != null && option.hasAttribute("aria-selected")
    })
    expect(activeMatches).toBe(true)
  })
})
