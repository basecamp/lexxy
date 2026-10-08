import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

async function readSelection(page) {
  const selected = await page.evaluate(() => window.getSelection().toString())
  return selected.replace(/\s+/g, " ").trim()
}

const TABLE = `<p>Before the table</p><figure class="lexxy-content__table-wrapper"><table><tbody>` +
  `<tr><th><p>Name</p></th><th><p>Notes</p></th></tr>` +
  `<tr><td><p>First cell</p></td><td><p>Alpha beta gamma delta</p></td></tr>` +
  `<tr><td><p>Third cell</p></td><td><p>Last cell</p></td></tr>` +
  `</tbody></table></figure><p>After the table</p>`

test.describe("Tables: triple-click inside a cell", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue(TABLE)
    await editor.flush()
  })

  test("triple-clicking a word selects the cell's text", async ({ page, editor }) => {
    await editor.content.locator("td span", { hasText: "Alpha beta gamma delta" }).click({ clickCount: 3 })
    await editor.flush()

    expect(await readSelection(page)).toBe("Alpha beta gamma delta")
  })

  test("triple-clicking a cell keeps the selection inside that cell", async ({ page, editor }) => {
    await editor.content.locator("td span", { hasText: "First cell" }).click({ clickCount: 3 })
    await editor.flush()

    expect(await readSelection(page)).toBe("First cell")
    await expect(editor.content.locator(".lexxy-content__table--selection")).toHaveCount(0)
  })
})
