import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml } from "../../helpers/assertions.js"

// Outlook and the web apps that show its mail end a line with <br> right before
// a list or a nested list starts. The list starts a new line anyway, so browsers
// show no blank line there, but imported as a line break it added one.
test.describe("Paste — a line break right before a block", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("adds no blank line before a nested list", async ({ editor }) => {
    await editor.paste("ignored", { html: "<ul><li>Level 1<br><ul><li>Level 2</li></ul></li></ul>" })

    await assertEditorHtml(editor, '<ul><li value="1">Level 1<ul><li value="1">Level 2</li></ul></li></ul>')
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("br")).toHaveCount(0)
    })
  })

  test("adds no blank line before a list", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div>Intro<br><ul><li>Item</li></ul>After</div>" })

    await assertEditorHtml(editor, '<p>Intro</p><ul><li value="1">Item</li></ul><p>After</p>')
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("br")).toHaveCount(0)
    })
  })

  test("adds no blank line when the line break sits inside styled text", async ({ editor }) => {
    await editor.paste("ignored", { html: '<ul><li><span style="font-size: 11pt">Level 1<br></span><ul><li>Level 2</li></ul></li></ul>' })

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("br")).toHaveCount(0)
      await expect(content.locator("li li")).toHaveText("Level 2")
    })
  })

  test("adds no blank line when the text and the line break are in separate styled runs", async ({ editor }) => {
    await editor.paste("ignored", { html: "<ul><li><span>Level 1</span><span><br></span><ul><li>Level 2</li></ul></li></ul>" })

    await assertEditorHtml(editor, '<ul><li value="1">Level 1<ul><li value="1">Level 2</li></ul></li></ul>')
  })

  test("keeps an empty line before a list when only an empty wrapper comes first", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div><span></span><br><ul><li>Item</li></ul></div>" })

    await assertEditorHtml(editor, '<p><br></p><ul><li value="1">Item</li></ul>')
  })

  test("keeps both empty lines at the start of a block before a list", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div><br><br><ul><li>Item</li></ul></div>" })

    await assertEditorHtml(editor, '<p><br><br></p><ul><li value="1">Item</li></ul>')
  })

  test("keeps a line holding a non-breaking space before a list", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div>Intro<br>&nbsp;<ul><li>Item</li></ul></div>" })

    await assertEditorHtml(editor, '<p>Intro<br>&nbsp;</p><ul><li value="1">Item</li></ul>')
  })

  test("adds no blank line when an empty styled run follows the line break", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div>Intro<br><span></span><ul><li>Item</li></ul></div>" })

    await assertEditorHtml(editor, '<p>Intro</p><ul><li value="1">Item</li></ul>')
  })

  test("adds no blank line when a styled run wraps the list after the line break", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div>Intro<br><span><ul><li>Item</li></ul></span></div>" })

    await expect.poll(() => editor.value()).toContain("<p>Intro</p>")
  })

  test("keeps a line break followed by another line before a list", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div>Intro<br><span><br></span><ul><li>Item</li></ul></div>" })

    await assertEditorHtml(editor, '<p>Intro<br></p><ul><li value="1">Item</li></ul>')
  })

  test("keeps an empty line at the start of a table cell after a cell with text", async ({ editor }) => {
    await editor.paste("ignored", { html: "<table><tr><td>Other cell</td><td><br><ul><li>Item</li></ul></td></tr></table>" })

    await expect.poll(() => editor.value()).toContain('<td><p><br></p><ul><li value="1">Item</li></ul></td>')
  })

  test("keeps an empty line at the start of a container after text outside it", async ({ editor }) => {
    await editor.paste("ignored", { html: "Outside text<main><br><ul><li>Item</li></ul></main>" })

    await expect.poll(() => editor.value()).toContain('<p><br></p><ul><li value="1">Item</li></ul>')
  })

  test("keeps an empty line after a block nested in styled text", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div><span><p>Earlier</p></span><br><ul><li>Item</li></ul></div>" })

    await expect.poll(() => editor.value()).toContain('<p><br></p><ul><li value="1">Item</li></ul>')
  })

  test("keeps the line a preserved newline adds after a line break before a list", async ({ editor }) => {
    await editor.paste("ignored", { html: '<div style="white-space: pre-wrap">Intro<br>\n<ul><li>Item</li></ul></div>' })

    await assertEditorHtml(editor, '<p>Intro<br></p><ul><li value="1">Item</li></ul>')
  })

  test("keeps an empty line at the start of a span shown as a block after text outside it", async ({ editor }) => {
    await editor.paste("ignored", { html: '<div>Outside text<span style="display: block"><br><ul><li>Item</li></ul></span></div>' })

    await assertEditorHtml(editor, '<p>Outside text<br></p><ul><li value="1">Item</li></ul>')
  })

  test("keeps an empty line before a list when only a script comes first", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div><script>track()</script><br><ul><li>Item</li></ul></div>" })

    await assertEditorHtml(editor, '<p><br></p><ul><li value="1">Item</li></ul>')
  })

  test("keeps a blank line the author left before a list", async ({ editor }) => {
    await editor.paste("ignored", { html: "<div>Intro<br><br><ul><li>Item</li></ul></div>" })

    await assertEditorHtml(editor, '<p>Intro<br></p><ul><li value="1">Item</li></ul>')
  })

  test("keeps a line break between two lines", async ({ editor }) => {
    await editor.paste("ignored", { html: "<ul><li>One<br>Two</li></ul>" })

    await assertEditorHtml(editor, '<ul><li value="1">One<br>Two</li></ul>')
  })
})
