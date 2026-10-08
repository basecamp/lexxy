import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

async function readSelection(page) {
  const selected = await page.evaluate(() => window.getSelection().toString())
  return selected.replace(/\s+/g, " ").trim()
}

async function clickInto(editor, text) {
  await editor.content.locator("span", { hasText: text }).first().click()
  await editor.flush()
}

async function pressSelectAll(page, editor) {
  await page.keyboard.press("ControlOrMeta+a")
  await editor.flush()
}

const IMAGE = `<action-text-attachment content-type="image/png" url="/example.png" filename="example.png" filesize="100" width="10" height="10" previewable="true"></action-text-attachment>`

function documentWithCell(cellHtml) {
  return DOCUMENT.replace("<p>Alpha beta gamma</p>", cellHtml)
}

const DOCUMENT = `<p>Before the table</p><figure class="lexxy-content__table-wrapper"><table><tbody>` +
  `<tr><th><p>Name</p></th><th><p>Notes</p></th></tr>` +
  `<tr><td><p>Alpha beta gamma</p></td><td><p>First paragraph</p><p>Second paragraph</p></td></tr>` +
  `</tbody></table></figure><p>After the table</p>`

test.describe("Tables: select all inside a cell", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue(DOCUMENT)
    await editor.flush()
  })

  test("the first select all selects the cell's contents", async ({ page, editor }) => {
    await clickInto(editor, "Alpha beta gamma")
    await pressSelectAll(page, editor)

    expect(await readSelection(page)).toBe("Alpha beta gamma")

    await page.keyboard.type("Replaced")
    await editor.flush()

    await expect(editor.content.locator("td").first()).toHaveText("Replaced")
    await expect(editor.content.locator("p", { hasText: "Before the table" })).toHaveCount(1)
    await expect(editor.content.locator("p", { hasText: "After the table" })).toHaveCount(1)
    await expect(editor.content.locator("td").nth(1)).toContainText("First paragraph")
  })

  test("the first select all covers every paragraph in the cell", async ({ page, editor }) => {
    await clickInto(editor, "Second paragraph")
    await pressSelectAll(page, editor)

    expect(await readSelection(page)).toBe("First paragraph Second paragraph")
  })

  test("a second select all selects the whole document", async ({ page, editor }) => {
    await clickInto(editor, "Alpha beta gamma")
    await pressSelectAll(page, editor)
    expect(await readSelection(page)).toBe("Alpha beta gamma")

    await pressSelectAll(page, editor)

    const selection = await readSelection(page)
    expect(selection).toContain("Before the table")
    expect(selection).toContain("Alpha beta gamma")
    expect(selection).toContain("After the table")
  })

  test("pasting after the first select all replaces only the cell's contents", async ({ page, editor }) => {
    await clickInto(editor, "Alpha beta gamma")
    await pressSelectAll(page, editor)
    await editor.paste("Pasted")
    await editor.flush()

    await expect(editor.content.locator("td").first()).toHaveText("Pasted")
    await expect(editor.content.locator("p", { hasText: "Before the table" })).toHaveCount(1)
    await expect(editor.content.locator("p", { hasText: "After the table" })).toHaveCount(1)
  })

  test("the first select all replaces a trailing attachment along with the cell's text", async ({ page, editor }) => {
    const errors = []
    page.on("pageerror", error => errors.push(error.message))
    await editor.setValue(documentWithCell(`<p>Tail words here</p>${IMAGE}`))
    await editor.flush()

    await clickInto(editor, "Tail words here")
    await pressSelectAll(page, editor)
    await page.keyboard.type("X")
    await page.keyboard.press("Shift+Enter")
    await page.keyboard.type("Y")
    await editor.flush()

    await expect(editor.content.locator("td").first().locator("figure")).toHaveCount(0)
    await expect(editor.content.locator("td").first().locator("p")).toHaveText("XY")
    expect(errors).toEqual([])
  })

  test("select all in a cell that starts with an attachment selects the whole document", async ({ page, editor }) => {
    const errors = []
    page.on("pageerror", error => errors.push(error.message))
    await editor.setValue(documentWithCell(`${IMAGE}<p>Tail words here</p>`))
    await editor.flush()

    await clickInto(editor, "Tail words here")
    await pressSelectAll(page, editor)

    const selection = await readSelection(page)
    expect(selection).toContain("Before the table")
    expect(selection).toContain("After the table")

    await page.keyboard.type("X")
    await editor.flush()
    expect(errors).toEqual([])
  })

  test("select all in an empty cell selects the whole document", async ({ page, editor }) => {
    await editor.setValue(documentWithCell("<p><br></p>"))
    await editor.flush()

    await editor.content.locator("td").first().click()
    await editor.flush()
    await pressSelectAll(page, editor)

    const selection = await readSelection(page)
    expect(selection).toContain("Before the table")
    expect(selection).toContain("After the table")
  })

  test("select all outside a table still selects the whole document", async ({ page, editor }) => {
    await clickInto(editor, "Before the table")
    await pressSelectAll(page, editor)

    const selection = await readSelection(page)
    expect(selection).toContain("Before the table")
    expect(selection).toContain("Alpha beta gamma")
    expect(selection).toContain("After the table")
  })
})
