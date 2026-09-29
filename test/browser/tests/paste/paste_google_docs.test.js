import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

// Google Docs never puts <strong>, <em> or <i> on the clipboard. It writes
// every run as a <span> with inline styles, spells bold as font-weight:700 and
// italic as font-style:italic, and wraps the whole selection in a
// <b style="font-weight:normal"> that must not make everything bold. A soft
// line break (Shift+Enter) arrives as a <br> inside a span.
//
// The fixture is the text/html Chrome put on the clipboard after copying
// "Some sample text *italic* **bold** <soft break> Soft Line break
// <paragraph break> Real line break" from Google Docs.
const GOOGLE_DOCS_HTML = readFileSync(resolve(import.meta.dirname, "../../../fixtures/files/google_docs_clipboard.html"), "utf-8")

const RUN_STYLE = "font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"
const PARAGRAPH = `<p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;">`

function run(text, { weight = 400, style = "normal" } = {}) {
  return `<span style="font-weight:${weight};font-style:${style};${RUN_STYLE}">${text}</span>`
}

const GOOGLE_DOCS_TEXT = "Some sample text italic bold \nSoft Line break\nReal line break"

async function pasteHtml(page, editor, html, text = "ignored") {
  await page.goto("/")
  await editor.waitForConnected()
  startMonitoringConsole(page)

  await editor.setValue("<p></p>")
  await editor.focus()

  await editor.paste(text, { html })
  await editor.flush()
}

test.describe("Paste from Google Docs", () => {
  test("keeps bold, italic and soft line breaks", async ({ page, editor }) => {
    await pasteHtml(page, editor, GOOGLE_DOCS_HTML, GOOGLE_DOCS_TEXT)

    await assertEditorHtml(
      editor,
      "<p>Some sample text <em>italic</em> <strong>bold</strong> <br>Soft Line break</p>" +
      "<p>Real line break</p>",
    )
    expect(page).toHaveNoErrors()
  })

  test("keeps bold and italic on the same run", async ({ page, editor }) => {
    await pasteHtml(page, editor, `<b style="font-weight:normal;">${PARAGRAPH}${run("both", { weight: 700, style: "italic" })}</p></b>`)

    await assertEditorHtml(editor, "<p><i><strong>both</strong></i></p>")
    expect(page).toHaveNoErrors()
  })

  test("does not import fonts or colors", async ({ page, editor }) => {
    await pasteHtml(page, editor, GOOGLE_DOCS_HTML, GOOGLE_DOCS_TEXT)

    const html = await editor.value()
    expect(html).not.toContain("font-family")
    expect(html).not.toContain("font-size")
    expect(html).not.toContain("color")
    expect(html).not.toContain("<mark")
    expect(html).not.toContain("Apple-interchange-newline")
  })
})

test.describe("Paste formatting from other sources", () => {
  test("keeps <strong> and <em>", async ({ page, editor }) => {
    await pasteHtml(page, editor, "<p>plain <strong>bold</strong> <em>italic</em></p>")

    await assertEditorHtml(editor, "<p>plain <strong>bold</strong> <em>italic</em></p>")
    expect(page).toHaveNoErrors()
  })

  test("keeps a plain <b> bold", async ({ page, editor }) => {
    await pasteHtml(page, editor, "<p>plain <b>bold</b></p>")

    await assertEditorHtml(editor, "<p>plain <strong>bold</strong></p>")
    expect(page).toHaveNoErrors()
  })

  test("keeps a leading Apple-interchange-newline as a line break", async ({ page, editor }) => {
    await pasteHtml(page, editor, `<br class="Apple-interchange-newline"><p>first</p><p>second</p>`)

    await assertEditorHtml(editor, "<p><br></p><p>first</p><p>second</p>")
    expect(page).toHaveNoErrors()
  })

  test("keeps a <br> inside a highlighted span", async ({ page, editor }) => {
    await pasteHtml(page, editor, `<p><span style="background-color: rgba(229, 223, 6, 0.3);">one<br>two</span></p>`)

    await assertEditorHtml(
      editor,
      `<p><mark style="background-color: var(--highlight-bg-1);">one</mark><br><mark style="background-color: var(--highlight-bg-1);">two</mark></p>`,
    )
    expect(page).toHaveNoErrors()
  })
})
