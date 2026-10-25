import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt popover positioning when the cursor geometry is unavailable", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  // Right after a Turbo history restore the editor reconnects before it is laid out,
  // so the cursor rect measures as 0×0. The menu used to anchor at x = 0 — pinned to
  // the editor's left edge (the "far left of the screen" report) and locked there for
  // the rest of the open cycle. The cursor position must report as unavailable in that
  // state so the menu stays unanchored until the geometry is reliable.
  test("reports no cursor position when the cursor rect is unreliable", async ({ page, editor }) => {
    await editor.send("hello @world")

    const positionWithLayout = await page.locator("lexxy-editor").evaluate((el) => el.selection.cursorPosition)
    expect(positionWithLayout).not.toBeNull()
    expect(positionWithLayout.x).toBeGreaterThan(0)

    const positionWithoutLayout = await page.locator("lexxy-editor").evaluate((el) => {
      const zeroRect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON() {} }
      const originalRangeRect = Range.prototype.getBoundingClientRect
      const originalElementRect = Element.prototype.getBoundingClientRect

      Range.prototype.getBoundingClientRect = () => zeroRect
      Element.prototype.getBoundingClientRect = function () {
        if (this.tagName === "SPAN" && this.style.width === "1px") return zeroRect
        return originalElementRect.call(this)
      }

      try {
        return el.selection.cursorPosition
      } finally {
        Range.prototype.getBoundingClientRect = originalRangeRect
        Element.prototype.getBoundingClientRect = originalElementRect
      }
    })

    expect(positionWithoutLayout).toBeNull()
  })
})
