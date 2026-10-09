import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { startMonitoringConsole } from "../../helpers/assertions.js"

const TABLE_HTML =
  '<figure class="lexxy-content__table-wrapper"><table><thead><tr><th>alpha</th><th>beta</th></tr></thead><tbody><tr><td>gamma</td><td>delta</td></tr></tbody></table></figure><p>After table</p>'

const valueOf = async (editor) => {
  await editor.flush()
  return editor.value()
}

test.describe("Tables disabled", () => {
  test("the table toolbar button is present by default (regression baseline)", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-toolbar[connected]")

    await expect(page.locator("lexxy-toolbar button[name='table']")).toBeVisible()
  })

  test("the table toolbar button is hidden when tables are disabled", async ({ page }) => {
    await page.goto("/tables-false.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")

    await expect(page.locator("lexxy-toolbar button[name='table']")).toBeHidden()
  })

  test("dispatching insertTable does nothing when tables are disabled", async ({ page, editor }) => {
    await page.goto("/tables-false.html")
    await editor.waitForConnected()

    await editor.click()
    await editor.locator.evaluate((el) => el.editor.update(() => el.editor.dispatchCommand("insertTable")))

    await expect(editor.content.locator("table")).toHaveCount(0)
    await expect.poll(() => valueOf(editor)).not.toContain("<table")
  })

  test("the lexxy-table-tools element is not created when tables are disabled", async ({ page, editor }) => {
    await page.goto("/tables-false.html")
    await editor.waitForConnected()

    await expect(editor.locator.locator("lexxy-table-tools")).toHaveCount(0)
  })

  test("loading a table strips it to plain text when tables are disabled", async ({ page, editor }) => {
    await page.goto("/tables-false.html")
    await editor.waitForConnected()

    await editor.setValue(TABLE_HTML)

    await expect(editor.content.locator("table")).toHaveCount(0)
    await expect.poll(() => valueOf(editor)).not.toContain("<table")
    await expect.poll(() => valueOf(editor)).not.toContain("lexxy-content__table-wrapper")
    await expect.poll(() => valueOf(editor)).toContain("After table")

    // strip-to-plain-text must preserve the cell content, not drop it
    const value = await valueOf(editor)
    for (const cell of [ "alpha", "beta", "gamma", "delta" ]) {
      expect(value).toContain(cell)
    }
  })

  test("editor connects without crashing when tables are disabled", async ({ page }) => {
    startMonitoringConsole(page)

    await page.goto("/tables-false.html")
    await page.waitForSelector("lexxy-editor[connected]")

    expect(page).toHaveNoErrors()
  })
})
