import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

async function openFormatDropdown(page) {
  await page.evaluate(() => {
    const details = document.querySelector("details:has(summary[name='format'])")
    details.open = true
    details.dispatchEvent(new Event("toggle"))
  })
}

async function clickFormatButton(page, command) {
  await openFormatDropdown(page)
  await page.locator(`[data-command='${command}']`).click()
}

test.describe("Heading format", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("large heading does not nest paragraph inside heading", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickFormatButton(page, "setFormatHeadingLarge")
    await assertEditorHtml(editor, "<h2>Lexxy</h2>")
  })

  test("medium heading does not nest paragraph inside heading", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickFormatButton(page, "setFormatHeadingMedium")
    await assertEditorHtml(editor, "<h3>Lexxy</h3>")
  })

  test("small heading does not nest paragraph inside heading", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickFormatButton(page, "setFormatHeadingSmall")
    await assertEditorHtml(editor, "<h4>Lexxy</h4>")
  })

  test("heading buttons are disabled inside a blockquote", async ({ page, editor }) => {
    await editor.setValue("<blockquote><p>Lexxy</p></blockquote>")
    await editor.content.locator("p").click()

    await openFormatDropdown(page)

    await expect(page.locator("[data-command='setFormatHeadingLarge']")).toBeDisabled()
    await expect(page.locator("[data-command='setFormatHeadingMedium']")).toBeDisabled()
    await expect(page.locator("[data-command='setFormatHeadingSmall']")).toBeDisabled()
    await assertEditorHtml(editor, "<blockquote><p>Lexxy</p></blockquote>")
  })

  test("paragraph button removes heading", async ({ page, editor }) => {
    await editor.setValue("<h2>Lexxy</h2>")
    await editor.select("Lexxy")

    await clickFormatButton(page, "setFormatParagraph")
    await assertEditorHtml(editor, "<p>Lexxy</p>")
  })

  test("paragraph button on heading inside blockquote preserves blockquote", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickFormatButton(page, "setFormatHeadingLarge")
    await editor.select("Lexxy")
    await clickFormatButton(page, "insertQuoteBlock")
    await assertEditorHtml(editor, "<blockquote><h2>Lexxy</h2></blockquote>")

    await editor.select("Lexxy")
    await clickFormatButton(page, "setFormatParagraph")
    await assertEditorHtml(editor, "<blockquote><p>Lexxy</p></blockquote>")
  })

  test("heading inside blockquote shows heading button as active, not paragraph", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    // Apply large heading, then wrap in blockquote
    await clickFormatButton(page, "setFormatHeadingLarge")
    await assertEditorHtml(editor, "<h2>Lexxy</h2>")

    await editor.select("Lexxy")
    await clickFormatButton(page, "insertQuoteBlock")
    await assertEditorHtml(editor, "<blockquote><h2>Lexxy</h2></blockquote>")

    // Click into the heading to place cursor and trigger button state update
    await editor.content.locator("h2").click()

    const headingLarge = page.locator("[name='heading-large']")
    const paragraph = page.locator("[name='paragraph']")

    await expect(headingLarge).toHaveAttribute("aria-pressed", "true")
    await expect(paragraph).toHaveAttribute("aria-pressed", "false")
  })

  test("switching from h2 to h3 does not hang", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.content.locator("p").click()

    await clickFormatButton(page, "setFormatHeadingLarge")
    await assertEditorHtml(editor, "<h2>Lexxy</h2>")

    await editor.content.locator("h2").click()
    await clickFormatButton(page, "setFormatHeadingMedium")
    await assertEditorHtml(editor, "<h3>Lexxy</h3>")
  })

  test("switching from h3 to h4 does not hang", async ({ page, editor }) => {
    await editor.setValue("<h3>Lexxy</h3>")
    await editor.content.locator("h3").click()

    await clickFormatButton(page, "setFormatHeadingSmall")
    await assertEditorHtml(editor, "<h4>Lexxy</h4>")
  })

  test("applying heading format to empty heading does not hang", async ({ page, editor }) => {
    await editor.setValue("<h2></h2>")
    await editor.content.locator("h2").click()

    await clickFormatButton(page, "setFormatHeadingMedium")
    await assertEditorHtml(editor, "<h3></h3>")
  })

  test("toggle heading off by clicking same heading button again", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickFormatButton(page, "setFormatHeadingLarge")
    await assertEditorHtml(editor, "<h2>Lexxy</h2>")

    await editor.select("Lexxy")
    await clickFormatButton(page, "setFormatHeadingLarge")
    await assertEditorHtml(editor, "<p>Lexxy</p>")
  })
})
