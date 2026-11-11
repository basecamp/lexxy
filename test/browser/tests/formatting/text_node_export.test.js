import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Text node export: clean bold and italic markup", () => {
  test("pasting markdown with bold + inline code produces clean HTML", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("**`aaa` or `bbb`**")
    await editor.flush()

    const html = await editor.value()

    // Should use <strong> for bold, not duplicate with <b>
    expect(html).not.toContain("<b>")
    expect(html).toContain("<strong>")
    expect(html).toContain("<code>")
  })

  test("pasting markdown with bold text produces clean HTML without redundant <b> tags", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("Hello **there**")
    await editor.flush()

    const html = await editor.value()

    // Should use <strong> for bold, not wrap in additional <b>
    expect(html).not.toContain("<b>")
    expect(html).toContain("<strong>")
  })

  test("setting bold text via toolbar produces clean HTML without redundant tags", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.send("hello")
    await editor.selectAll()
    await editor.clickToolbarButton("bold")
    await editor.flush()

    const html = await editor.value()

    // Should use <strong> for bold, not duplicate with <b>
    expect(html).not.toContain("<b>")
    expect(html).toContain("<strong>")
  })

  test("strikethrough and underline go inside a highlight so their lines take its color", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.setValue('<p><u><s><i><mark style="color: var(--highlight-1);"><strong>done</strong></mark></i></s></u></p>')

    await assertEditorHtml(
      editor,
      '<p><i><mark style="color: var(--highlight-1);"><u><s><strong>done</strong></s></u></mark></i></p>',
    )
  })

  test("strikethrough and underline wrap text that has no highlight", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.setValue("<p><u><s><strong>done</strong></s></u></p>")

    await assertEditorHtml(editor, "<p><u><s><strong>done</strong></s></u></p>")
  })
})
