import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

async function readSelection(page) {
  const selected = await page.evaluate(() => window.getSelection().toString())
  return selected.replace(/\s+/g, " ").trim()
}

async function tripleClick(editor, selector, text) {
  await editor.content.locator(selector, { hasText: text }).first().click({ clickCount: 3 })
  await editor.flush()
}

function tableWith(...rows) {
  const cells = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")
  return `<p>Before the table</p><figure class="lexxy-content__table-wrapper"><table><tbody>` +
    `<tr><th><p>Name</p></th><th><p>Header notes</p></th></tr>${cells}</tbody></table></figure><p>After the table</p>`
}

test.describe("Tables: triple-click inside a cell", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("selects the clicked paragraph", async ({ page, editor }) => {
    await editor.setValue(tableWith([ "<p>First cell</p>", "<p>Alpha beta gamma delta</p>" ]))
    await editor.flush()

    await tripleClick(editor, "td span", "Alpha beta gamma delta")

    expect(await readSelection(page)).toBe("Alpha beta gamma delta")
  })

  test("keeps the selection inside the clicked cell", async ({ page, editor }) => {
    await editor.setValue(tableWith([ "<p>First cell</p>", "<p>Second cell</p>" ]))
    await editor.flush()

    await tripleClick(editor, "td span", "First cell")

    expect(await readSelection(page)).toBe("First cell")
    await expect(editor.content.locator(".lexxy-content__table--selection")).toHaveCount(0)
  })

  test("selects the clicked paragraph in a header cell", async ({ page, editor }) => {
    await editor.setValue(tableWith([ "<p>First cell</p>", "<p>Second cell</p>" ]))
    await editor.flush()

    await tripleClick(editor, "th span", "Header notes")

    expect(await readSelection(page)).toBe("Header notes")
  })

  test("selects the whole paragraph across soft line breaks, but not the cell's other paragraphs", async ({ page, editor }) => {
    await editor.setValue(tableWith([ "<p>First cell</p>", "<p>First line<br>Second line</p><p>Other paragraph</p>" ]))
    await editor.flush()

    await tripleClick(editor, "td span", "Second line")

    expect(await readSelection(page)).toBe("First line Second line")
  })

  test("selects the clicked list item", async ({ page, editor }) => {
    await editor.setValue(tableWith([ "<p>First cell</p>", "<ul><li>Alpha beta gamma</li><li>Second item</li></ul>" ]))
    await editor.flush()

    await tripleClick(editor, "td li span", "Alpha beta gamma")

    expect(await readSelection(page)).toBe("Alpha beta gamma")
  })

  test("selects the clicked paragraph inside a quote", async ({ page, editor }) => {
    await editor.setValue(tableWith([ "<p>First cell</p>", "<blockquote><p>Alpha beta gamma</p></blockquote>" ]))
    await editor.flush()

    await tripleClick(editor, "td blockquote span", "Alpha beta gamma")

    expect(await readSelection(page)).toBe("Alpha beta gamma")
  })
})

test.describe("Triple-click in an editor placed inside a page's table cell", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/editor-in-table-cell.html")
    await editor.waitForConnected()
    await editor.setValue("<p>P1 Line one<br>P1 Line two<br>P1 Line three</p><p>P2 Line one</p>")
    await editor.flush()
  })

  test("still selects only the clicked visual line", async ({ page, editor }) => {
    await tripleClick(editor, "p span", "P1 Line two")

    expect(await readSelection(page)).toBe("P1 Line two")
  })
})
