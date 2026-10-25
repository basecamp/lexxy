import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

const TABLE_HTML =
  '<figure class="lexxy-content__table-wrapper"><table><thead><tr><th>alpha</th><th>beta</th></tr></thead><tbody><tr><td>gamma</td><td>delta</td></tr></tbody></table></figure><p>After table</p>'

const TABLE_AS_PARAGRAPHS = "<p>alpha</p><p>beta</p><p>gamma</p><p>delta</p><p>After table</p>"

test.describe("Tables enabled", () => {
  test("the table toolbar button is visible", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-toolbar[connected]")

    await expect(page.locator("lexxy-toolbar button[name='table']")).toBeVisible()
  })
})

test.describe("Tables disabled", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/tables-false.html")
    await editor.waitForConnected()
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("the table toolbar button is hidden", async ({ page }) => {
    await expect(page.locator("lexxy-toolbar button[name='table']")).toBeHidden()
  })

  test("the insertTable command does nothing", async ({ editor }) => {
    await editor.click()
    await editor.locator.evaluate((el) => el.editor.dispatchCommand("insertTable"))
    await editor.flush()

    await expect(editor.content.locator("table")).toHaveCount(0)
  })

  test("the table tools are not created", async ({ editor }) => {
    await expect(editor.locator.locator("lexxy-table-tools")).toHaveCount(0)
  })

  test("setting a value with a table turns each cell into a paragraph", async ({ editor }) => {
    await editor.setValue(TABLE_HTML)

    await assertEditorHtml(editor, TABLE_AS_PARAGRAPHS)
  })

  test("captions, nested tables and block content in cells keep their text", async ({ editor }) => {
    await editor.setValue(
      "<table><caption>Caption</caption><tr><th><p>one</p><p>two</p></th><td><ul><li>item</li></ul></td></tr>" +
      "<tr><td>outer<table><tr><th>inner</th><td><strong>bold</strong> text</td></tr></table></td></tr></table>"
    )

    await assertEditorHtml(editor,
      '<p>Caption</p><p>one</p><p>two</p><ul><li value="1">item</li></ul><p>outer</p><p>inner</p><p><strong>bold</strong> text</p>'
    )
  })

  test("pasted HTML tables turn into paragraphs", async ({ editor }) => {
    await editor.paste("alpha beta gamma delta After table", { html: TABLE_HTML })

    await assertEditorHtml(editor, TABLE_AS_PARAGRAPHS)
  })

  test("pasted Markdown tables turn into paragraphs", async ({ editor }) => {
    await editor.paste("| alpha | beta |\n|---|---|\n| gamma | delta |\n\nAfter table")

    await assertEditorHtml(editor, TABLE_AS_PARAGRAPHS)
  })

  test("pasted Lexical data with a table turns into paragraphs", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue(TABLE_HTML)
    await editor.flush()
    const lexical = await editor.locator.evaluate((el) =>
      JSON.stringify({ namespace: el.editor._config.namespace, nodes: el.editor.getEditorState().toJSON().root.children })
    )

    await page.goto("/tables-false.html")
    await editor.waitForConnected()
    await editor.paste("alpha beta gamma delta After table", { html: TABLE_HTML, lexical })

    await assertEditorHtml(editor, TABLE_AS_PARAGRAPHS)
  })

  test("the editor connects without console errors", async ({ page, editor }) => {
    startMonitoringConsole(page)

    await page.goto("/tables-false.html")
    await editor.waitForConnected()

    expect(page).toHaveNoErrors()
  })
})

test.describe("Tables disabled, with a table in the initial value", () => {
  test("the table turns into paragraphs, keeping links", async ({ page, editor }) => {
    await page.goto("/tables-false-initial-value.html")
    await editor.waitForConnected()

    await expect(editor.content.locator("table")).toHaveCount(0)
    await assertEditorHtml(editor, '<p>alpha</p><p>beta</p><p>gamma</p><p><a href="https://example.com/">delta</a></p>')
  })
})
