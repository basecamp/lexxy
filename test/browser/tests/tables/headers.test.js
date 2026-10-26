import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Tables — Headers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("toggling header style on row", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")

    const table = editor.content.locator("table")
    const headerRow = table.locator("tr:has(th + th + th)")
    const singleHeaderRow = table.locator("tr:has(th + td + td)")

    await expect(headerRow).toHaveCount(1)
    await expect(singleHeaderRow).toHaveCount(2)

    await editor.openTableRowMenu()
    await editor.clickTableButton("Toggle row style")

    await expect(headerRow).toHaveCount(0)
    await expect(singleHeaderRow).toHaveCount(3)

    await editor.openTableRowMenu()
    await editor.clickTableButton("Toggle row style")

    await expect(headerRow).toHaveCount(1)
    await expect(singleHeaderRow).toHaveCount(2)
  })

  test("toggling header style on column", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")

    const table = editor.content.locator("table")

    await expect(table.locator("tr > th:first-child")).toHaveCount(3)

    await editor.openTableColumnMenu()
    await editor.clickTableButton("Toggle column style")

    await expect(table.locator("tr > th:first-child")).toHaveCount(1)

    await editor.openTableColumnMenu()
    await editor.clickTableButton("Toggle column style")

    await expect(table.locator("tr > th:first-child")).toHaveCount(3)
  })
})
