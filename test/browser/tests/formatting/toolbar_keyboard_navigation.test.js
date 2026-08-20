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

  test("opening a menu with the mouse still shows a focus ring on the first item", async ({ page }) => {
    await page.locator("lexxy-toolbar button[name='highlight']").click()

    const firstColor = page.locator("lexxy-highlight-dropdown [data-dropdown-panel] button").first()
    await expect(firstColor).toBeFocused()
    await expect.poll(() => firstColor.evaluate(element => element.matches(":focus-visible"))).toBe(true)
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

  test("applying a menu command with the keyboard returns focus to the editor", async ({ page, editor }) => {
    await editor.send("Hello World")

    const formatTrigger = page.locator("lexxy-toolbar button[name='format']")
    await formatTrigger.focus()
    await formatTrigger.press("Enter")
    await expect.poll(() => focusedName(page)).toBe("paragraph")

    await page.keyboard.press("Enter")
    await expect.poll(() => editor.isFocused()).toBe(true)
  })

  test("applying a command from the overflow menu returns focus to the editor", async ({ page, editor }) => {
    await page.setViewportSize({ width: 300, height: 600 })
    await page.waitForSelector("lexxy-toolbar[overflowing]")
    await editor.send("Hello World")

    await page.locator("lexxy-toolbar .lexxy-editor__toolbar-overflow button[data-dropdown-trigger]").click()
    const undo = page.locator(".lexxy-editor__toolbar-overflow-menu button[name='undo']")
    await undo.focus()
    await expect.poll(() => focusedName(page)).toBe("undo")

    await page.keyboard.press("Enter")
    await expect.poll(() => editor.isFocused()).toBe(true)
  })

  test("arrow navigation stops on disabled buttons so they can be announced", async ({ page, editor }) => {
    await editor.send("Hello World")

    const redo = page.locator("lexxy-toolbar button[name='redo']")
    await expect(redo).toHaveAttribute("aria-disabled", "true")

    await page.locator("lexxy-toolbar button[name='undo']").focus()
    await expect.poll(() => focusedName(page)).toBe("undo")

    await page.keyboard.press("ArrowRight")
    await expect.poll(() => focusedName(page)).toBe("redo")
  })

  test("focus stays on the button when its own action disables it", async ({ page, editor }) => {
    await editor.send("Hello World")

    const undo = page.locator("lexxy-toolbar button[name='undo']")
    await undo.focus()
    await expect.poll(() => focusedName(page)).toBe("undo")

    // Focus must stay on the button as it disables itself, not fall to the body
    let guard = 0
    while ((await undo.evaluate((element) => element.ariaDisabled)) !== "true" && guard++ < 20) {
      await page.keyboard.press("Enter")
      await editor.flush()
    }

    await expect(undo).toHaveAttribute("aria-disabled", "true")
    await expect.poll(() => focusedName(page)).toBe("undo")
  })
})
