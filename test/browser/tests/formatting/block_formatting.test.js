import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { HELLO_EVERYONE, clickToolbarButton, openToolbarDropdown } from "../../helpers/toolbar.js"

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
    await assertEditorHtml(editor, '<ul><li value="1">Hello everyone</li></ul>')
  })

  test("toggle bullet list off", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, '<ul><li value="1">Hello everyone</li></ul>')

    await editor.select("everyone")
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("toggle bullet list off with multiple items", async ({ page, editor }) => {
    await editor.setValue("<p>Alpha</p><p>Bravo</p><p>Charlie</p>")
    await editor.selectAll()
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, '<ul><li value="1">Alpha</li><li value="2">Bravo</li><li value="3">Charlie</li></ul>')

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
    await assertEditorHtml(editor, '<ol><li value="1">Hello everyone</li></ol>')
  })

  test("toggle numbered list off", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, '<ol><li value="1">Hello everyone</li></ol>')

    await editor.select("everyone")
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("toggle numbered list off with multiple items", async ({ page, editor }) => {
    await editor.setValue("<p>Alpha</p><p>Bravo</p><p>Charlie</p>")
    await editor.selectAll()
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, '<ol><li value="1">Alpha</li><li value="2">Bravo</li><li value="3">Charlie</li></ol>')

    await editor.selectAll()
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, "<p>Alpha</p><p>Bravo</p><p>Charlie</p>")
  })

  test("ordered list exports li value attribute", async ({ editor }) => {
    await editor.setValue("<ol><li>First</li><li>Second</li></ol>")
    await assertEditorHtml(editor, '<ol><li value="1">First</li><li value="2">Second</li></ol>')
  })

  test("nested ordered list numbering is calculated correctly", async ({ editor }) => {
    await editor.setValue('<ol><li>First</li><li><ol><li>Nested</li></ol></li><li>Second</li></ol>')
    await assertEditorHtml(editor, '<ol><li value="1">First</li><li value="2" class="lexxy-nested-listitem"><ol><li value="1">Nested</li></ol></li><li value="2">Second</li></ol>')
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

  test("quote preserves line breaks when entire paragraph with BRs is selected", async ({
    page,
    editor,
  }) => {
    // When the whole paragraph with BRs is selected, BRs should be preserved
    // inside the blockquote — not split into separate paragraphs.
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
      "<p>Before</p><blockquote><p>First line<br>Second line</p></blockquote><p>After</p>",
    )
  })

  test("quote only selected lines across paragraphs with mixed break types", async ({
    page,
    editor,
  }) => {
    // Line one (Shift+Enter) Line two (Enter) Line three (Shift+Enter) Line four
    // Selecting "Line two" through "Line three" should quote only those lines,
    // not the entire paragraphs.
    await editor.setValue(
      "<p>Line one<br>Line two</p><p>Line three<br>Line four</p>",
    )

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

  test("quote preserves BRs when all text with line breaks is selected", async ({
    page,
    editor,
  }) => {
    // Selecting all content of a paragraph with BRs and quoting should
    // preserve the BRs inside the blockquote.
    await editor.setValue("<p>Line one<br>Line two<br>Line three</p>")
    await editor.selectAll()

    await page.getByRole("button", { name: "Quote" }).click()

    await assertEditorHtml(
      editor,
      "<blockquote><p>Line one<br>Line two<br>Line three</p></blockquote>",
    )
  })

  test("bullet list only the selected line from soft line breaks", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>First line<br>Second line<br>Third line</p>")
    await editor.select("Second line")

    await page.getByRole("button", { name: "Bullet list" }).click()

    await assertEditorHtml(
      editor,
      '<p>First line</p><ul><li value="1">Second line</li></ul><p>Third line</p>',
    )
  })

  test("numbered list only the selected line from soft line breaks", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>First line<br>Second line<br>Third line</p>")
    await editor.select("Second line")

    await page.getByRole("button", { name: "Numbered list" }).click()

    await assertEditorHtml(
      editor,
      '<p>First line</p><ol><li value="1">Second line</li></ol><p>Third line</p>',
    )
  })

  test("shift+enter inside a list item creates a line break, not a new item", async ({
    editor,
  }) => {
    await editor.setValue("<ul><li>First item</li></ul>")
    await editor.select("First item")
    await editor.send("End")
    await editor.send("Shift+Enter")
    await editor.send("continuation")

    await assertEditorHtml(
      editor,
      '<ul><li value="1">First item<br>continuation</li></ul>',
    )
  })

  test("links", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await editor.flush()

    await openToolbarDropdown(page, "link")

    const input = page.locator("lexxy-link-dropdown [data-dropdown-panel] input[type='url']").first()
    await expect(input).toBeVisible({ timeout: 2_000 })
    await input.fill("https://37signals.com")
    await page
      .locator("lexxy-link-dropdown [data-dropdown-panel] button[value='link']")
      .first()
      .click()

    await assertEditorHtml(
      editor,
      '<p>Hello <a href="https://37signals.com">everyone</a></p>',
    )
  })

  test("pressing Enter in link URL input links selection without submitting form", async ({
    page,
    editor,
  }) => {
    await page.evaluate(() => {
      window.__submitCount = 0
      document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault()
        window.__submitCount += 1
      })
    })

    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await editor.flush()

    await openToolbarDropdown(page, "link")

    const input = page.locator("lexxy-link-dropdown [data-dropdown-panel] input[type='url']").first()
    await expect(input).toBeVisible({ timeout: 2_000 })
    await input.fill("https://37signals.com")
    await input.press("Enter")

    await assertEditorHtml(
      editor,
      '<p>Hello <a href="https://37signals.com">everyone</a></p>',
    )

    const submitCount = await page.evaluate(() => window.__submitCount)
    expect(submitCount).toBe(0)
  })

  test("link dialog shows existing URL when link is selected", async ({
    page,
    editor,
  }) => {
    await editor.setValue(
      '<p>Hello <a href="https://37signals.com">everyone</a></p>',
    )
    await editor.select("everyone")
    await editor.flush()

    await openToolbarDropdown(page, "link")

    const input = page.locator("lexxy-link-dropdown [data-dropdown-panel] input[type='url']").first()
    await expect(input).toBeVisible({ timeout: 2_000 })
    await expect(input).toHaveValue("https://37signals.com")
  })

  test("link dialog shows empty input when no link is selected", async ({
    page,
    editor,
  }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await editor.flush()

    await openToolbarDropdown(page, "link")

    const input = page.locator("lexxy-link-dropdown [data-dropdown-panel] input[type='url']").first()
    await expect(input).toBeVisible({ timeout: 2_000 })
    await expect(input).toHaveValue("")
  })
})
