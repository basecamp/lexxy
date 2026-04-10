import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Text drag-and-drop in editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  // Dragging selected text then applying code formatting should not
  // crash the editor. A previous bug caused "closest is not a function"
  // in the attachment drag handler when event.target lacked .closest().
  test("text drag-and-drop followed by code formatting works", async ({ page, editor }) => {
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.setValue("<p>Hello world this is some text</p>")
    await editor.select("world")
    await editor.flush()

    // Perform a drag gesture using Playwright mouse API
    const wordBound = await page.evaluate(() => {
      const sel = window.getSelection()
      if (!sel.rangeCount) return null
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    })

    if (wordBound) {
      await page.mouse.move(wordBound.x, wordBound.y)
      await page.mouse.down()
      await page.mouse.move(wordBound.x + 30, wordBound.y, { steps: 5 })
      await page.mouse.up()
    }

    await editor.flush()

    // Apply code formatting — should not crash
    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    const fatalErrors = errors.filter(
      (e) =>
        e.includes("closest is not a function") ||
        e.includes("node not found")
    )
    expect(fatalErrors).toHaveLength(0)
  })
})
