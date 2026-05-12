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

  test("quote only the selected line when browser selection uses paragraph offsets", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>First line<br>Second line<br>Third line</p>")

    await editor.content.evaluate((el) => {
      const paragraph = el.querySelector("p")
      const range = document.createRange()
      range.setStart(paragraph, 2)
      range.setEnd(paragraph, 3)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })

    await page.getByRole("button", { name: "Quote" }).click()

    await assertEditorHtml(
      editor,
      "<p>First line</p><blockquote><p>Second line</p></blockquote><p>Third line</p>",
    )
  })

  test("quote wraps only the current line when cursor is collapsed at end of a middle line", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>aaaa<br>bbbb<br>cccc</p>")

    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let bbbb
      let node
      while ((node = walker.nextNode())) {
        if (node.nodeValue === "bbbb") bbbb = node
      }
      const range = document.createRange()
      range.setStart(bbbb, 4)
      range.setEnd(bbbb, 4)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })

    await page.getByRole("button", { name: "Quote" }).click()

    await assertEditorHtml(
      editor,
      "<p>aaaa</p><blockquote><p>bbbb</p></blockquote><p>cccc</p>",
    )
  })

  test("quote wraps only the current line when cursor is collapsed at end of first line", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>aaaa<br>bbbb<br>cccc</p>")

    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let aaaa
      let node
      while ((node = walker.nextNode())) {
        if (node.nodeValue === "aaaa") aaaa = node
      }
      const range = document.createRange()
      range.setStart(aaaa, 4)
      range.setEnd(aaaa, 4)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })

    await page.getByRole("button", { name: "Quote" }).click()

    await assertEditorHtml(
      editor,
      "<blockquote><p>aaaa</p></blockquote><p>bbbb<br>cccc</p>",
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

test.describe("Blockquote selection matrix", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  async function selectRange(editor, anchor, focus) {
    await editor.content.evaluate((el, args) => {
      function resolve(spec) {
        const target = el.querySelector(spec.selector)
        if (spec.kind === "para") {
          return [target, spec.childIndex]
        }
        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT)
        return [walker.nextNode(), spec.offset]
      }
      const [aNode, aOff] = resolve(args.anchor)
      const [fNode, fOff] = resolve(args.focus)
      const range = document.createRange()
      range.setStart(aNode, aOff)
      range.setEnd(fNode, fOff)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }, { anchor, focus })
  }

  const t = (selector, offset) => ({ kind: "text", selector, offset })
  const p = (selector, childIndex) => ({ kind: "para", selector, childIndex })

  const PLAIN = "<p>aaaa<br><br>bbbb</p>"
  const LINK = '<p><a href="https://example.com/">aaaa</a><br><br><a href="https://example.com/">bbbb</a></p>'

  const PLAIN_AAAA = 'p > span:nth-of-type(1)'
  const PLAIN_BBBB = 'p > span:nth-of-type(2)'
  const A1 = 'p > a:nth-of-type(1)'
  const A2 = 'p > a:nth-of-type(2)'

  const A = '<a href="https://example.com/">aaaa</a>'
  const B = '<a href="https://example.com/">bbbb</a>'

  const cases = [
    { name: "01. <p>|aaaa|<br><br>bbbb</p>",                     html: PLAIN, anchor: t(PLAIN_AAAA, 0), focus: t(PLAIN_AAAA, 4), expected: "<blockquote><p>aaaa</p></blockquote><p><br>bbbb</p>" },
    { name: "02. <p>|aaaa<br>|<br>bbbb</p>",                     html: PLAIN, anchor: t(PLAIN_AAAA, 0), focus: p("p", 2),        expected: "<blockquote><p>aaaa<br></p></blockquote><p>bbbb</p>" },
    { name: "03. <p>|aaaa<br><br>|bbbb</p>",                     html: PLAIN, anchor: t(PLAIN_AAAA, 0), focus: t(PLAIN_BBBB, 0), expected: "<blockquote><p>aaaa<br></p></blockquote><p>bbbb</p>" },
    { name: "04. <p>|aaaa<br><br>bbbb|</p>",                     html: PLAIN, anchor: t(PLAIN_AAAA, 0), focus: t(PLAIN_BBBB, 4), expected: "<blockquote><p>aaaa<br><br>bbbb</p></blockquote>" },
    { name: "05. <p>aaaa|<br>|<br>bbbb</p>",                     html: PLAIN, anchor: t(PLAIN_AAAA, 4), focus: p("p", 2),        expected: "<p>aaaa</p><blockquote><p><br></p></blockquote><p>bbbb</p>" },
    { name: "06. <p>aaaa|<br><br>|bbbb</p>",                     html: PLAIN, anchor: t(PLAIN_AAAA, 4), focus: t(PLAIN_BBBB, 0), expected: "<p>aaaa</p><blockquote><p><br></p></blockquote><p>bbbb</p>" },
    { name: "07. <p>aaaa|<br><br>bbbb|</p>",                     html: PLAIN, anchor: t(PLAIN_AAAA, 4), focus: t(PLAIN_BBBB, 4), expected: "<p>aaaa</p><blockquote><p><br>bbbb</p></blockquote>" },
    { name: "08. <p>aaaa<br>|<br>|bbbb</p>",                     html: PLAIN, anchor: p("p", 2),        focus: t(PLAIN_BBBB, 0), expected: "<p>aaaa</p><blockquote><p><br></p></blockquote><p>bbbb</p>" },
    { name: "09. <p>aaaa<br>|<br>bbbb|</p>",                     html: PLAIN, anchor: p("p", 2),        focus: t(PLAIN_BBBB, 4), expected: "<p>aaaa</p><blockquote><p><br>bbbb</p></blockquote>" },
    { name: "10. <p>aaaa<br><br>|bbbb|</p>",                     html: PLAIN, anchor: t(PLAIN_BBBB, 0), focus: t(PLAIN_BBBB, 4), expected: "<p>aaaa<br></p><blockquote><p>bbbb</p></blockquote>" },

    { name: "11. <p>|<a>aaaa</a>|<br><br><a>bbbb</a></p>",       html: LINK,  anchor: p("p", 0),    focus: p("p", 1),    expected: `<blockquote><p>${A}</p></blockquote><p><br>${B}</p>` },
    { name: "12. <p>|<a>aaaa</a><br>|<br><a>bbbb</a></p>",       html: LINK,  anchor: p("p", 0),    focus: p("p", 2),    expected: `<blockquote><p>${A}<br></p></blockquote><p>${B}</p>` },
    { name: "13. <p>|<a>aaaa</a><br><br>|<a>bbbb</a></p>",       html: LINK,  anchor: p("p", 0),    focus: p("p", 3),    expected: `<blockquote><p>${A}<br></p></blockquote><p>${B}</p>` },
    { name: "14. <p>|<a>aaaa</a><br><br><a>|bbbb</a></p>",       html: LINK,  anchor: p("p", 0),    focus: t(A2, 0),     expected: `<blockquote><p>${A}<br></p></blockquote><p>${B}</p>` },
    { name: "15. <p>|<a>aaaa</a><br><br><a>bbbb|</a></p>",       html: LINK,  anchor: p("p", 0),    focus: t(A2, 4),     expected: `<blockquote><p>${A}<br><br>${B}</p></blockquote>` },
    { name: "16. <p><a>aaaa|</a><br>|<br><a>bbbb</a></p>",       html: LINK,  anchor: t(A1, 4),     focus: p("p", 2),    expected: `<p>${A}</p><blockquote><p><br></p></blockquote><p>${B}</p>` },
    { name: "17. <p><a>aaaa|</a><br><br>|<a>bbbb</a></p>",       html: LINK,  anchor: t(A1, 4),     focus: p("p", 3),    expected: `<p>${A}</p><blockquote><p><br></p></blockquote><p>${B}</p>` },
    { name: "18. <p><a>aaaa|</a><br><br><a>|bbbb</a></p>",       html: LINK,  anchor: t(A1, 4),     focus: t(A2, 0),     expected: `<p>${A}</p><blockquote><p><br></p></blockquote><p>${B}</p>` },
    { name: "19. <p><a>aaaa|</a><br><br><a>bbbb|</a></p>",       html: LINK,  anchor: t(A1, 4),     focus: t(A2, 4),     expected: `<p>${A}</p><blockquote><p><br>${B}</p></blockquote>` },
    { name: "20. <p><a>aaaa</a>|<br>|<br><a>bbbb</a></p>",       html: LINK,  anchor: p("p", 1),    focus: p("p", 2),    expected: `<p>${A}</p><blockquote><p><br></p></blockquote><p>${B}</p>` },
    { name: "21. <p><a>aaaa</a>|<br><br>|<a>bbbb</a></p>",       html: LINK,  anchor: p("p", 1),    focus: p("p", 3),    expected: `<p>${A}</p><blockquote><p><br></p></blockquote><p>${B}</p>` },
    { name: "22. <p><a>aaaa</a>|<br><br><a>|bbbb</a></p>",       html: LINK,  anchor: p("p", 1),    focus: t(A2, 0),     expected: `<p>${A}</p><blockquote><p><br></p></blockquote><p>${B}</p>` },
    { name: "23. <p><a>aaaa</a>|<br><br><a>bbbb|</a></p>",       html: LINK,  anchor: p("p", 1),    focus: t(A2, 4),     expected: `<p>${A}</p><blockquote><p><br>${B}</p></blockquote>` },
    { name: "24. <p><a>aaaa</a><br>|<br>|<a>bbbb</a></p>",       html: LINK,  anchor: p("p", 2),    focus: p("p", 3),    expected: `<p>${A}</p><blockquote><p><br></p></blockquote><p>${B}</p>` },
    { name: "25. <p><a>aaaa</a><br>|<br><a>|bbbb</a></p>",       html: LINK,  anchor: p("p", 2),    focus: t(A2, 0),     expected: `<p>${A}</p><blockquote><p><br></p></blockquote><p>${B}</p>` },
    { name: "26. <p><a>aaaa</a><br>|<br><a>bbbb|</a></p>",       html: LINK,  anchor: p("p", 2),    focus: t(A2, 4),     expected: `<p>${A}</p><blockquote><p><br>${B}</p></blockquote>` },
  ]

  for (const c of cases) {
    test(c.name, async ({ page, editor }) => {
      await editor.setValue(c.html)
      await selectRange(editor, c.anchor, c.focus)
      await page.getByRole("button", { name: "Quote" }).click()
      await assertEditorHtml(editor, c.expected)
    })
  }
})
