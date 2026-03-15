import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Tables — Manipulation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("deleting the table", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")

    await expect(editor.content.locator("table")).toBeVisible()

    await editor.clickTableButton("Delete this table?")

    await expect(editor.content.locator("table")).toHaveCount(0)
  })

  test("select all and delete when table is first child does not crash", async ({
    page,
    editor,
  }) => {
    const tableHtml = `<figure class="lexxy-content__table-wrapper"><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></figure><p>After table</p>`
    await editor.setValue(tableHtml)
    await editor.flush()

    await expect(editor.content.locator("table")).toHaveCount(1)

    // Place the cursor in the paragraph after the table
    await editor.click()
    await editor.select("After table")
    await editor.flush()

    // Listen for page errors (the bug threw: "Expected to find a parent TableCellNode")
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.selectAll()
    await editor.send("Backspace")
    await editor.flush()

    // Table should be removed without errors
    await expect(editor.content.locator("table")).toHaveCount(0)
    expect(errors.filter((e) => e.includes("#148"))).toHaveLength(0)
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
