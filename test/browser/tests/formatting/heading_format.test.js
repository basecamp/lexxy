import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { clickToolbarButton } from "../../helpers/toolbar.js"

function dispatchCommand(page, command, payload) {
  return page.evaluate(([ command, payload ]) => {
    document.querySelector("lexxy-editor").editor.dispatchCommand(command, payload)
  }, [ command, payload ])
}

function recreateEditorWithHeadings(page, headings) {
  return page.evaluate((headings) => {
    const editor = document.querySelector("lexxy-editor")
    const parent = editor.parentElement
    editor.remove()

    const fresh = document.createElement("lexxy-editor")
    fresh.setAttribute("headings", JSON.stringify(headings))
    parent.appendChild(fresh)
  }, headings)
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

    await clickToolbarButton(page, "heading-large")
    await assertEditorHtml(editor, "<h2>Lexxy</h2>")
  })

  test("medium heading does not nest paragraph inside heading", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickToolbarButton(page, "heading-medium")
    await assertEditorHtml(editor, "<h3>Lexxy</h3>")
  })

  test("small heading does not nest paragraph inside heading", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickToolbarButton(page, "heading-small")
    await assertEditorHtml(editor, "<h4>Lexxy</h4>")
  })

  test("paragraph button removes heading", async ({ page, editor }) => {
    await editor.setValue("<h2>Lexxy</h2>")
    await editor.select("Lexxy")

    await clickToolbarButton(page, "setFormatParagraph")
    await assertEditorHtml(editor, "<p>Lexxy</p>")
  })

  test("paragraph button on heading inside blockquote preserves blockquote", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await clickToolbarButton(page, "heading-large")
    await editor.select("Lexxy")
    await clickToolbarButton(page, "insertQuoteBlock")
    await assertEditorHtml(editor, "<blockquote><h2>Lexxy</h2></blockquote>")

    await editor.select("Lexxy")
    await clickToolbarButton(page, "setFormatParagraph")
    await assertEditorHtml(editor, "<blockquote><p>Lexxy</p></blockquote>")
  })

  test("dropdown reflects the active heading when its buttons are first built", async ({ page, editor }) => {
    await editor.setValue("<h2>Lexxy</h2>")
    await editor.select("Lexxy")

    // Rebuild the dropdown so its buttons are created while the selection is
    // already in a heading, mimicking the initial-render ordering where the
    // toolbar's selection listener may run before the buttons exist.
    await page.evaluate(() => {
      const dropdown = document.querySelector("lexxy-heading-dropdown")
      const parent = dropdown.parentElement
      dropdown.remove()

      const fresh = document.createElement("lexxy-heading-dropdown")
      fresh.innerHTML = `<div class="lexxy-heading-options"></div>`
      parent.appendChild(fresh)
    })

    await expect(page.locator("[name='heading-large']")).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("[name='heading-medium']")).toHaveAttribute("aria-pressed", "false")
  })

  test("dedicated commands apply the default headings when invoked by name", async ({ page, editor }) => {
    for (const [ command, tag ] of [ [ "setFormatHeadingLarge", "h2" ], [ "setFormatHeadingMedium", "h3" ], [ "setFormatHeadingSmall", "h4" ] ]) {
      await editor.setValue("<p>Lexxy</p>")
      await editor.select("Lexxy")

      await dispatchCommand(page, command)
      await assertEditorHtml(editor, `<${tag}>Lexxy</${tag}>`)
    }
  })

  test("dedicated commands map to the first configured headings", async ({ page, editor }) => {
    await recreateEditorWithHeadings(page, [ "h1", "h5" ])
    await editor.waitForConnected()

    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")
    await dispatchCommand(page, "setFormatHeadingLarge")
    await assertEditorHtml(editor, "<h1>Lexxy</h1>")

    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")
    await dispatchCommand(page, "setFormatHeadingMedium")
    await assertEditorHtml(editor, "<h5>Lexxy</h5>")

    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")
    await dispatchCommand(page, "setFormatHeadingSmall")
    await assertEditorHtml(editor, "<p>Lexxy</p>")
  })

  test("applyHeadingFormat applies the given tag", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    await dispatchCommand(page, "applyHeadingFormat", "h3")
    await assertEditorHtml(editor, "<h3>Lexxy</h3>")
  })

  test("heading inside blockquote shows heading button as active, not paragraph", async ({ page, editor }) => {
    await editor.setValue("<p>Lexxy</p>")
    await editor.select("Lexxy")

    // Apply large heading, then wrap in blockquote
    await clickToolbarButton(page, "heading-large")
    await assertEditorHtml(editor, "<h2>Lexxy</h2>")

    await editor.select("Lexxy")
    await clickToolbarButton(page, "insertQuoteBlock")
    await assertEditorHtml(editor, "<blockquote><h2>Lexxy</h2></blockquote>")

    // Click into the heading to place cursor and trigger button state update
    await editor.content.locator("h2").click()

    const headingLarge = page.locator("[name='heading-large']")
    const paragraph = page.locator("[name='paragraph']")

    await expect(headingLarge).toHaveAttribute("aria-pressed", "true")
    await expect(paragraph).toHaveAttribute("aria-pressed", "false")
  })
})
