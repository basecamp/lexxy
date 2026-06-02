import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { clickToolbarButton, openAlignmentDropdown } from "../../helpers/toolbar.js"

test.describe("Text alignment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("aligns a paragraph to the right", async ({ page, editor }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("Hello")

    await clickToolbarButton(page, "alignRight")

    await assertEditorHtml(editor, '<p style="text-align: right;">Hello everyone</p>')
  })

  test("centers a paragraph", async ({ page, editor }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("Hello")

    await clickToolbarButton(page, "alignCenter")

    await assertEditorHtml(editor, '<p style="text-align: center;">Hello everyone</p>')
  })

  test("justifies a paragraph", async ({ page, editor }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("Hello")

    await clickToolbarButton(page, "alignJustify")

    await assertEditorHtml(editor, '<p style="text-align: justify;">Hello everyone</p>')
  })

  test("switches a right-aligned paragraph to left", async ({ page, editor }) => {
    await editor.setValue('<p style="text-align: right;">Hello everyone</p>')
    await editor.select("Hello")

    await clickToolbarButton(page, "alignLeft")

    await assertEditorHtml(editor, '<p style="text-align: left;">Hello everyone</p>')
  })

  test("aligns a heading", async ({ page, editor }) => {
    await editor.setValue("<h2>Hello everyone</h2>")
    await editor.select("Hello")

    await clickToolbarButton(page, "alignCenter")

    await assertEditorHtml(editor, '<h2 style="text-align: center;">Hello everyone</h2>')
  })

  test("aligns a list item", async ({ page, editor }) => {
    await editor.setValue("<ul><li>Hello everyone</li></ul>")
    await editor.select("Hello")

    await clickToolbarButton(page, "alignRight")

    await assertEditorHtml(editor, '<ul><li value="1" style="text-align: right;">Hello everyone</li></ul>')
  })

  test("aligns text inside a table cell", async ({ page, editor }) => {
    const tableHtml = `<figure class="lexxy-content__table-wrapper"><table><tbody><tr><td>Hello everyone</td></tr></tbody></table></figure>`
    await editor.setValue(tableHtml)
    await editor.flush()

    await editor.select("Hello")
    await clickToolbarButton(page, "alignCenter")
    await editor.flush()

    await expect(editor.content.locator("td [style*='text-align: center']")).toContainText("Hello everyone")
  })

  test("alignment survives a setValue round-trip", async ({ page, editor }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("Hello")
    await clickToolbarButton(page, "alignRight")

    const html = await editor.value()
    expect(html).toContain('text-align: right')

    await editor.setValue(html)
    await assertEditorHtml(editor, '<p style="text-align: right;">Hello everyone</p>')
  })

  test("dropdown reflects the active alignment", async ({ page, editor }) => {
    await editor.setValue('<p style="text-align: center;">Hello everyone</p>')
    await editor.select("Hello")

    await openAlignmentDropdown(page)

    await expect(page.locator("[name='align-center']")).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("[name='align-left']")).toHaveAttribute("aria-pressed", "false")
    await expect(page.locator("[name='align-right']")).toHaveAttribute("aria-pressed", "false")
    await expect(page.locator("[name='align-justify']")).toHaveAttribute("aria-pressed", "false")
  })
})
