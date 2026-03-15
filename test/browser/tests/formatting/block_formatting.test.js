import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { HELLO_EVERYONE } from "../../helpers/toolbar.js"

test.describe("Block formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("rotate headers", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")

    await page.getByRole("button", { name: "Heading" }).click()
    await assertEditorHtml(editor, "<h2>Hello everyone</h2>")

    await page.getByRole("button", { name: "Heading" }).click()
    await assertEditorHtml(editor, "<h3>Hello everyone</h3>")

    await page.getByRole("button", { name: "Heading" }).click()
    await assertEditorHtml(editor, "<h4>Hello everyone</h4>")

    await page.getByRole("button", { name: "Heading" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("bullet list", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<ul><li>Hello everyone</li></ul>")
  })

  test("numbered list", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, "<ol><li>Hello everyone</li></ol>")
  })

  test("insert quote without selection", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(
      editor,
      "<blockquote><p>Hello everyone</p></blockquote>",
    )
  })

  test("quote", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")

    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(
      editor,
      "<blockquote><p>Hello everyone</p></blockquote>",
    )

    await editor.select("everyone")
    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("multi line quote", async ({ page, editor }) => {
    await editor.setValue("<p>Hello</p><p>Everyone</p>")
    await editor.selectAll()
    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(
      editor,
      "<blockquote><p>Hello</p><p>Everyone</p></blockquote>",
    )
  })

  test("quote only the selected line from soft line breaks", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>First line<br>Second line<br>Third line</p>")
    await editor.select("Second line")

    await page.getByRole("button", { name: "Quote" }).click()

    await assertEditorHtml(
      editor,
      "<p>First line</p><blockquote><p>Second line</p></blockquote><p>Third line</p>",
    )
  })

  test("links", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await editor.flush()

    // Open the link dropdown programmatically to avoid focus/selection loss
    // that occurs with a real click on the summary element
    await page.evaluate(() => {
      const details = document.querySelector(
        "details:has(summary[name='link'])",
      )
      details.open = true
      details.dispatchEvent(new Event("toggle"))
    })

    const input = page.locator("lexxy-link-dropdown input[type='url']").first()
    await expect(input).toBeVisible({ timeout: 2_000 })
    await input.fill("https://37signals.com")
    await page
      .locator("lexxy-link-dropdown button[value='link']")
      .first()
      .click()

    await assertEditorHtml(
      editor,
      '<p>Hello <a href="https://37signals.com">everyone</a></p>',
    )
  })
})
