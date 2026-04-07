import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { HELLO_EVERYONE, clickToolbarButton } from "../../helpers/toolbar.js"

test.describe("Block formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("apply and cycle headings", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")

    await clickToolbarButton(page, "setFormatHeadingLarge")
    await assertEditorHtml(editor, "<h2>Hello everyone</h2>")

    await editor.select("everyone")
    await clickToolbarButton(page, "setFormatHeadingMedium")
    await assertEditorHtml(editor, "<h3>Hello everyone</h3>")

    await editor.select("everyone")
    await clickToolbarButton(page, "setFormatHeadingSmall")
    await assertEditorHtml(editor, "<h4>Hello everyone</h4>")

    await editor.select("everyone")
    await clickToolbarButton(page, "setFormatParagraph")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("bullet list", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<ul><li>Hello everyone</li></ul>")
  })

  test("toggle bullet list off", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<ul><li>Hello everyone</li></ul>")

    await editor.select("everyone")
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("toggle bullet list off with multiple items", async ({ page, editor }) => {
    await editor.setValue("<p>Alpha</p><p>Bravo</p><p>Charlie</p>")
    await editor.selectAll()
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<ul><li>Alpha</li><li>Bravo</li><li>Charlie</li></ul>")

    await editor.selectAll()
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<p>Alpha</p><p>Bravo</p><p>Charlie</p>")
  })

  test("toggle nested bullet list off", async ({ page, editor }) => {
    await editor.setValue("<ul><li>Parent<ul><li>Child</li></ul></li></ul>")
    await editor.selectAll()
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<p>Parent</p><p>Child</p>")
  })

  test("numbered list", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, "<ol><li>Hello everyone</li></ol>")
  })

  test("toggle numbered list off", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, "<ol><li>Hello everyone</li></ol>")

    await editor.select("everyone")
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("toggle numbered list off with multiple items", async ({ page, editor }) => {
    await editor.setValue("<p>Alpha</p><p>Bravo</p><p>Charlie</p>")
    await editor.selectAll()
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, "<ol><li>Alpha</li><li>Bravo</li><li>Charlie</li></ol>")

    await editor.selectAll()
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, "<p>Alpha</p><p>Bravo</p><p>Charlie</p>")
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

    await page.locator("[data-command='insertQuoteBlock']").click()

    await assertEditorHtml(
      editor,
      "<p>First line</p><blockquote><p>Second line</p></blockquote><p>Third line</p>",
    )
  })

  test("quote soft-break lines splits them into separate paragraphs in the blockquote", async ({
    page,
    editor,
  }) => {
    // Selecting two soft-break lines and quoting should split them into
    // separate paragraphs inside the blockquote, not merge them into one.
    await editor.setValue(
      "<p>Before</p><p>First line<br>Second line</p><p>After</p>",
    )

    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let startNode, endNode
      let node
      while ((node = walker.nextNode())) {
        if (node.nodeValue.includes("First line")) startNode = node
        if (node.nodeValue.includes("Second line")) endNode = node
      }
      const range = document.createRange()
      range.setStart(startNode, 0)
      range.setEnd(endNode, endNode.nodeValue.length)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })

    await page.getByRole("button", { name: "Quote" }).click()

    await assertEditorHtml(
      editor,
      "<p>Before</p><blockquote><p>First line</p><p>Second line</p></blockquote><p>After</p>",
    )
  })

  test("quote only selected lines across paragraphs with mixed break types", async ({
    page,
    editor,
  }) => {
    // Line one (Shift+Enter) Line two (Enter) Line three (Shift+Enter) Line four
    // Selecting "Line two" through "Line three" and applying quote should only
    // quote those two lines, not all four.
    await editor.setValue(
      "<p>Line one<br>Line two</p><p>Line three<br>Line four</p>",
    )

    // Select from "Line two" in the first <p> through "Line three" in the second <p>
    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let startNode, endNode
      let node
      while ((node = walker.nextNode())) {
        if (node.nodeValue.includes("Line two")) startNode = node
        if (node.nodeValue.includes("Line three")) endNode = node
      }
      const range = document.createRange()
      range.setStart(startNode, 0)
      range.setEnd(endNode, endNode.nodeValue.length)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })

    await page.getByRole("button", { name: "Quote" }).click()

    await assertEditorHtml(
      editor,
      "<p>Line one</p><blockquote><p>Line two</p><p>Line three</p></blockquote><p>Line four</p>",
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
