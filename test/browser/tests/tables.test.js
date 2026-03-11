import { test, expect } from "../fixtures.js"
import {
  assertEditorContent,
  assertEditorTableStructure,
} from "../helpers/assertions.js"

test.describe("Tables", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/new")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("adding a table", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await assertEditorTableStructure(editor, 3, 3)
  })

  test("writing in table fields", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await editor.send("Test Cell")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table th").first()).toContainText(
        "Test Cell",
      )
    })
  })

  test("adding a new row", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await editor.clickTableButton("Add row")
    await assertEditorTableStructure(editor, 3, 4)
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

  test("deleting a row", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")

    await expect(editor.content.locator("table tr")).toHaveCount(3)

    await editor.clickTableButton("Remove row")

    await expect(editor.content.locator("table tr")).toHaveCount(2)
  })

  test("adding a new column", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await assertEditorTableStructure(editor, 3, 3)

    await editor.clickTableButton("Add column")
    await assertEditorTableStructure(editor, 4, 3)
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

  test("deleting a column", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await assertEditorTableStructure(editor, 3, 3)

    await editor.clickTableButton("Remove column")
    await assertEditorTableStructure(editor, 2, 3)
  })

  test("deleting the table", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")

    await expect(editor.content.locator("table")).toBeVisible()

    await editor.clickTableButton("Delete this table?")

    await expect(editor.content.locator("table")).toHaveCount(0)
  })

  test("table is wrapped in figure.table-wrapper", async ({
    page,
    editor,
  }) => {
    await editor.clickToolbarButton("insertTable")
    await editor.flush()

    const value = await editor.value()
    // Parse the exported HTML in the browser to check structure
    const hasWrapper = await page.evaluate((html) => {
      const template = document.createElement("template")
      template.innerHTML = html
      const figure = template.content.querySelector(
        "figure.lexxy-content__table-wrapper",
      )
      return figure !== null && figure.querySelector("table") !== null
    }, value)
    expect(hasWrapper).toBe(true)
  })
})
