import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { clickToolbarButton } from "../../helpers/toolbar.js"

test.describe("Turning indented list items into paragraphs", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")

    await editor.setValue("<ul><li>First</li><li>Second</li><li>Third</li></ul>")
    await editor.select("Second")
    await editor.sendTab()
  })

  test("toggling the bullet list off leaves no indentation", async ({ page, editor }) => {
    await editor.selectAll()
    await page.getByRole("button", { name: "Bullet list" }).click()

    await assertEditorHtml(editor, "<p>First</p><p>Second</p><p>Third</p>")
    await expect(editor.content.locator("p[style]")).toHaveCount(0)
  })

  test("applying normal text leaves no indentation", async ({ page, editor }) => {
    await editor.selectAll()
    await clickToolbarButton(page, "setFormatParagraph")

    await assertEditorHtml(editor, "<p>First</p><p>Second</p><p>Third</p>")
    await expect(editor.content.locator("p[style]")).toHaveCount(0)
  })

  test("clearing formatting leaves no indentation", async ({ page, editor }) => {
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")

    await assertEditorHtml(editor, "<p>First</p><p>Second</p><p>Third</p>")
    await expect(editor.content.locator("p[style]")).toHaveCount(0)
  })

  test("toggling only the indented item off leaves no indentation", async ({ page, editor }) => {
    await editor.select("Second")
    await page.getByRole("button", { name: "Bullet list" }).click()

    await expect(editor.content.locator("p", { hasText: "Second" })).toHaveCount(1)
    await expect(editor.content.locator("p[style]")).toHaveCount(0)
  })

  test("turning the indented item into a heading leaves no indentation", async ({ page, editor }) => {
    await editor.select("Second")
    await clickToolbarButton(page, "heading-large")

    await expect(editor.content.locator("h2", { hasText: "Second" })).toHaveCount(1)
    await expect(editor.content.locator("h2[style]")).toHaveCount(0)
  })
})
