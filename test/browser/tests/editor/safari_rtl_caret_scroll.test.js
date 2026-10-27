import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Safari reports a collapsed caret as `selection.type === "Range"`, which makes
// Lexical re-apply the DOM selection and run scrollIntoViewIfNeeded on every
// keystroke. For a caret in RTL text Safari also returns a bogus caret rect
// above the editor, so the page jumped up on every space or backspace.
// Automation can't drive Safari's native RTL input, so this simulates both
// behaviors. Lexical fixed it upstream in 0.48 (facebook/lexical#8848).
test.describe("Safari RTL caret scroll", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const typeDescriptor = Object.getOwnPropertyDescriptor(Selection.prototype, "type")
      Object.defineProperty(Selection.prototype, "type", {
        configurable: true,
        get() {
          if (window.simulateSafariCaret && this.isCollapsed) return "Range"
          return typeDescriptor.get.call(this)
        }
      })

      const getBoundingClientRect = Range.prototype.getBoundingClientRect
      Range.prototype.getBoundingClientRect = function () {
        const root = document.querySelector(".lexxy-editor__content")
        if (window.simulateSafariCaret && this.collapsed && root?.contains(this.startContainer)) {
          return new DOMRect(0, -400, 0, 20)
        }
        return getBoundingClientRect.call(this)
      }
    })

    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("typing doesn't scroll the page to a bogus caret rect above the editor", async ({ page, editor }) => {
    await page.evaluate(() => {
      document.body.style.paddingBlock = "1500px"
      document.querySelector("lexxy-editor").scrollIntoView({ block: "center" })
    })
    await editor.focus()
    await editor.send("مرحبا")

    const scrollYBefore = await page.evaluate(() => window.scrollY)
    await page.evaluate(() => { window.simulateSafariCaret = true })
    await editor.send(" ", "بك", "Backspace", " ")

    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))

    expect(await page.evaluate(() => window.scrollY)).toBe(scrollYBefore)
    await expect(editor.content).toBeInViewport()
  })
})
