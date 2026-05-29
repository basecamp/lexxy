import { test } from "../../test_helper.js"
import { EditorHandle } from "../../helpers/editor_handle.js"
import { expect } from "@playwright/test"

test.describe("Prompt vertical-direction attribute", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 340 })
    await page.goto("/prompt-vertical-direction.html")
  })

  test("vertical-direction=\"top\" opens the prompt above the cursor", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='top'] lexxy-editor")
    await editor.waitForConnected()

    await editor.send("@")

    const popover = page.locator("[data-editor='top'] .lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")

    const positions = await page.locator("[data-editor='top']").evaluate((container) => {
      const editor = container.querySelector("lexxy-editor")
      const popover = container.querySelector(".lexxy-prompt-menu--visible")
      const editorRect = editor.getBoundingClientRect()
      const popoverRect = popover.getBoundingClientRect()

      return {
        editorBottom: editorRect.bottom,
        popoverBottom: popoverRect.bottom,
        viewportBottom: window.innerHeight,
      }
    })

    expect(positions.popoverBottom).toBeLessThanOrEqual(positions.editorBottom)
    expect(positions.popoverBottom).toBeLessThanOrEqual(positions.viewportBottom)
  })

  test("vertical-direction=\"bottom\" keeps the prompt below the cursor even at the viewport edge", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='bottom'] lexxy-editor")
    await editor.waitForConnected()

    await editor.send("@")

    const popover = page.locator("[data-editor='bottom'] .lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })
    await expect(popover).not.toHaveAttribute("data-clipped-at-bottom", "")

    const positions = await page.locator("[data-editor='bottom']").evaluate((container) => {
      const editor = container.querySelector("lexxy-editor")
      const popover = container.querySelector(".lexxy-prompt-menu--visible")
      const editorRect = editor.getBoundingClientRect()
      const popoverRect = popover.getBoundingClientRect()

      return {
        editorTop: editorRect.top,
        popoverTop: popoverRect.top,
        popoverBottom: popoverRect.bottom,
        viewportBottom: window.innerHeight,
      }
    })

    expect(positions.popoverTop).toBeGreaterThanOrEqual(positions.editorTop)
    expect(positions.popoverBottom).toBeGreaterThanOrEqual(positions.viewportBottom)
  })
})
