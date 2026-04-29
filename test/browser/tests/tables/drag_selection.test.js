import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Tables — Drag selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("click+drag across multiple cells selects all cells the cursor moves over", async ({ page, editor }) => {
    await editor.clickToolbarButton("insertTable")
    await editor.flush()

    const cells = editor.content.locator("table :is(th, td)")
    await expect(cells).toHaveCount(9)

    const [ a1, b1, c1 ] = await cells.evaluateAll((elements) => {
      return elements.slice(0, 3).map((cell) => {
        const { left, top, width, height } = cell.getBoundingClientRect()
        return { x: left + width / 2, y: top + height / 2 }
      })
    })

    await page.mouse.move(a1.x, a1.y)
    await page.mouse.down()
    await page.mouse.move(b1.x, b1.y, { steps: 8 })
    await page.mouse.move(c1.x, c1.y, { steps: 8 })
    await page.mouse.up()

    await editor.flush()

    const selectedCells = editor.content.locator(".lexxy-content__table-cell--selected")
    await expect(selectedCells).toHaveCount(3)
    await expect(cells.nth(0)).toHaveClass(/lexxy-content__table-cell--selected/)
    await expect(cells.nth(1)).toHaveClass(/lexxy-content__table-cell--selected/)
    await expect(cells.nth(2)).toHaveClass(/lexxy-content__table-cell--selected/)
  })
})
