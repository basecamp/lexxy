import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { HELLO_EVERYONE, focusedName } from "../../helpers/toolbar.js"

test.describe("Toolbar keyboard navigation", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await editor.setValue(HELLO_EVERYONE)
  })

  test("the toolbar moves with left and right, not up and down", async ({ page }) => {
    await page.locator("lexxy-toolbar button[name='bold']").focus()
    await expect.poll(() => focusedName(page)).toBe("bold")

    await page.keyboard.press("ArrowDown")
    await expect.poll(() => focusedName(page)).toBe("bold")

    await page.keyboard.press("ArrowRight")
    await expect.poll(() => focusedName(page)).toBe("italic")

    await page.keyboard.press("ArrowUp")
    await expect.poll(() => focusedName(page)).toBe("italic")

    await page.keyboard.press("ArrowLeft")
    await expect.poll(() => focusedName(page)).toBe("bold")
  })

  test("arrow keys keep moving along the toolbar when focus is on a menu dropdown trigger", async ({ page }) => {
    const formatTrigger = page.locator("lexxy-toolbar button[name='format']")
    await formatTrigger.focus()
    await expect.poll(() => focusedName(page)).toBe("format")

    await page.keyboard.press("ArrowRight")
    await expect.poll(() => focusedName(page)).toBe("highlight")

    await page.keyboard.press("ArrowLeft")
    await expect.poll(() => focusedName(page)).toBe("format")
  })

  test("an open menu traps arrow navigation and wraps around", async ({ page }) => {
    await page.locator("lexxy-toolbar button[name='format']").click()
    await expect.poll(() => focusedName(page)).toBe("paragraph")

    // Wraps to the last item instead of leaking to the toolbar
    await page.keyboard.press("ArrowUp")
    await expect.poll(() => focusedName(page)).toBe("clear-formatting")

    // And back to the first
    await page.keyboard.press("ArrowDown")
    await expect.poll(() => focusedName(page)).toBe("paragraph")

    await page.keyboard.press("ArrowDown")
    await expect.poll(() => focusedName(page)).toBe("heading-large")
  })

  test("the color grid moves with all four arrows", async ({ page }) => {
    await page.locator("lexxy-toolbar button[name='highlight']").click()

    const focusedColorIndex = () =>
      page.evaluate(() => {
        const buttons = [ ...document.querySelectorAll("lexxy-highlight-dropdown [data-dropdown-panel] button") ]
        return buttons.indexOf(document.activeElement)
      })

    await expect.poll(focusedColorIndex).toBe(0)

    await page.keyboard.press("ArrowRight")
    await expect.poll(focusedColorIndex).toBe(1)

    await page.keyboard.press("ArrowLeft")
    await expect.poll(focusedColorIndex).toBe(0)

    // Down also moves linearly, not by column
    await page.keyboard.press("ArrowDown")
    await expect.poll(focusedColorIndex).toBe(1)

    await page.keyboard.press("ArrowUp")
    await expect.poll(focusedColorIndex).toBe(0)
  })

  test("Escape returns focus to the trigger when the menu was opened from the toolbar", async ({ page }) => {
    const formatTrigger = page.locator("lexxy-toolbar button[name='format']")
    await formatTrigger.focus()
    await formatTrigger.press("Enter")
    await expect.poll(() => focusedName(page)).toBe("paragraph")

    await page.keyboard.press("Escape")
    await expect.poll(() => focusedName(page)).toBe("format")
  })

  test("Escape returns focus to the editor when the dropdown was opened from the editor", async ({ page, editor }) => {
    await editor.focus()
    await page.keyboard.press("Control+k")
    await expect(page.locator("lexxy-link-dropdown input[type='url']")).toBeFocused()

    await page.keyboard.press("Escape")
    await expect.poll(() => editor.isFocused()).toBe(true)
  })

  test("Escape returns focus to the editor when the menu was opened with the mouse", async ({ page, editor }) => {
    await page.locator("lexxy-toolbar button[name='format']").click()
    await expect.poll(() => focusedName(page)).toBe("paragraph")

    await page.keyboard.press("Escape")
    await expect.poll(() => editor.isFocused()).toBe(true)
  })
})
