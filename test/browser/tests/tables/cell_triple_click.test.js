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

function image(filename) {
  return `<action-text-attachment content-type="image/png" url="/example.png" filename="${filename}" filesize="100" width="10" height="10" previewable="true"></action-text-attachment>`
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
    await editor.setValue(tableWith([ "<p>First cell</p>", "<blockquote><p>Opening paragraph</p><p>Alpha beta gamma</p></blockquote>" ]))
    await editor.flush()

    await tripleClick(editor, "td blockquote span", "Alpha beta gamma")

    expect(await readSelection(page)).toBe("Alpha beta gamma")
  })

  test("selects only the clicked image in a gallery", async ({ page, editor }) => {
    const gallery = `<div class="attachment-gallery attachment-gallery--2">${image("one.png")}${image("two.png")}</div>`
    await editor.setValue(tableWith([ "<p>First cell</p>", gallery ]))
    await editor.flush()

    await editor.content.locator("td img").first().click({ clickCount: 3 })
    await editor.flush()
    await page.keyboard.press("Delete")
    await editor.flush()

    await expect(editor.content.locator("td img")).toHaveCount(1)
  })

  test("keeps a cell selection made by triple-click-dragging across a nested table", async ({ page, editor }) => {
    const nestedTable = `<figure class="lexxy-content__table-wrapper"><table><tbody><tr>` +
      `<td><p>Cell A text</p></td><td><p>Cell B text</p></td><td><p>Cell C text</p></td></tr></tbody></table></figure>`
    await editor.setValue(tableWith([ "<p>First cell</p>", nestedTable ]))
    await editor.flush()

    const from = await editor.content.locator("span", { hasText: "Cell A text" }).boundingBox()
    const to = await editor.content.locator("span", { hasText: "Cell B text" }).boundingBox()
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down({ clickCount: 1 })
    await page.mouse.up({ clickCount: 1 })
    await page.mouse.down({ clickCount: 2 })
    await page.mouse.up({ clickCount: 2 })
    await page.mouse.down({ clickCount: 3 })
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 })
    await page.mouse.up({ clickCount: 3 })
    await editor.flush()

    await expect(editor.content.locator("td", { hasText: "Cell C text" }).last()).not.toHaveClass(/lexxy-content__table-cell--selected/)
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
