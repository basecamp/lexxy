import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

// Word and Outlook never put <ul>/<ol>/<li> on the clipboard. They simulate lists
// with flat paragraphs: the depth lives in `mso-list:lN levelM lfoK` in the style
// attribute, and the bullet or number glyph sits in a <span style="mso-list:Ignore">
// fenced by <![if !supportLists]> conditional comments. The helpers below build
// that markup the way Word writes it.
//
// Word renders a bullet as the raw glyph of its marker font: Symbol's "·" at level
// one, Courier New's "o" at level two, Wingdings' "§" at level three.
const SYMBOL_BULLET = "·"
const COURIER_BULLET = "o"
const WINGDINGS_BULLET = "§"

const MARKER_GAP = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "

function wordListParagraph(level, marker, text, { listId = 0, font = "Symbol" } = {}) {
  const markerSpan =
    `<span style='font-family:${font};mso-fareast-font-family:${font}'>` +
    `<span style='mso-list:Ignore'>${marker}` +
    `<span style='font:7.0pt "Times New Roman"'>${MARKER_GAP}</span>` +
    `</span></span>`

  return (
    `<p class=MsoListParagraph style='margin-left:${0.25 * level}in;text-indent:-.25in;` +
    `mso-list:l${listId} level${level} lfo${listId + 1}'>` +
    `<![if !supportLists]>${markerSpan}<![endif]>${text}<o:p></o:p></p>`
  )
}

function wordParagraph(text) {
  return `<p class=MsoNormal>${text}<o:p></o:p></p>`
}

// Word always ships a style sheet alongside the body, including the @list rules that
// describe each level. Keeping it here proves the rebuild works with the sheet present
// and does not depend on it surviving — Office style sheets are stripped on paste.
function wordDocument(...body) {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15">
<style>
<!--
p.MsoNormal, li.MsoNormal, div.MsoNormal
\t{margin:0in;
\tfont-size:12.0pt;
\tfont-family:"Calibri",sans-serif;
\tcolor:black;}
p.MsoListParagraph, li.MsoListParagraph, div.MsoListParagraph
\t{margin-left:.5in;
\tfont-size:12.0pt;
\tfont-family:"Calibri",sans-serif;}
@list l0:level1
\t{mso-level-number-format:bullet;
\tmso-level-text:\\F0B7;
\ttext-indent:-.25in;
\tfont-family:Symbol;}
-->
</style>
</head>
<body lang=EN-US style='tab-interval:.5in;word-wrap:break-word'>
<div class=WordSection1>
${body.join("\n")}
</div>
</body>
</html>`
}

async function assertWordPasteBecomes(page, editor, body, expectedHtml) {
  await page.goto("/")
  await editor.waitForConnected()
  startMonitoringConsole(page)

  await editor.setValue("<p></p>")
  await editor.focus()

  await editor.paste("ignored", { html: wordDocument(...body) })
  await editor.flush()

  await assertEditorHtml(editor, expectedHtml)
  expect(page).toHaveNoErrors()
}

test.describe("Paste a Word/Outlook bulleted list", () => {
  test("rebuilds a flat bulleted list into a real <ul>", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [
        wordListParagraph(1, SYMBOL_BULLET, "First item"),
        wordListParagraph(1, SYMBOL_BULLET, "Second item"),
      ],
      '<ul><li value="1">First item</li><li value="2">Second item</li></ul>',
    )
  })

  test("nests each bulleted level under the item above it", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [
        wordListParagraph(1, SYMBOL_BULLET, "First item"),
        wordListParagraph(2, COURIER_BULLET, "Nested item", { font: "Courier New" }),
        wordListParagraph(3, WINGDINGS_BULLET, "Deeply nested item", { font: "Wingdings" }),
        wordListParagraph(1, SYMBOL_BULLET, "Second item"),
      ],
      '<ul><li value="1">First item<ul><li value="1">Nested item' +
        '<ul><li value="1">Deeply nested item</li></ul></li></ul></li>' +
        '<li value="2">Second item</li></ul>',
    )
  })

  test("treats Courier New's bare \"o\" marker as a bullet, not a counter", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [ wordListParagraph(1, COURIER_BULLET, "An item", { font: "Courier New" }) ],
      '<ul><li value="1">An item</li></ul>',
    )
  })
})

test.describe("Paste a Word/Outlook numbered list", () => {
  test("rebuilds a flat numbered list into a real <ol>", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [
        wordListParagraph(1, "1.", "First item"),
        wordListParagraph(1, "2.", "Second item"),
      ],
      '<ol><li value="1">First item</li><li value="2">Second item</li></ol>',
    )
  })

  test("nests numbered levels through Word's letter and roman counters", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [
        wordListParagraph(1, "1)", "First item"),
        wordListParagraph(2, "a)", "Nested item"),
        wordListParagraph(3, "iv)", "Deeply nested item"),
        wordListParagraph(1, "2)", "Second item"),
      ],
      '<ol><li value="1">First item<ol><li value="1">Nested item' +
        '<ol><li value="1">Deeply nested item</li></ol></li></ol></li>' +
        '<li value="2">Second item</li></ol>',
    )
  })

  test("keeps a bulleted sublist under a numbered parent", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [
        wordListParagraph(1, "1.", "First item"),
        wordListParagraph(2, WINGDINGS_BULLET, "Nested bullet", { font: "Wingdings" }),
        wordListParagraph(1, "2.", "Second item"),
      ],
      '<ol><li value="1">First item<ul><li value="1">Nested bullet</li></ul></li>' +
        '<li value="2">Second item</li></ol>',
    )
  })

  test("starts a new list when the marker switches type at the same level", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [
        wordListParagraph(1, "1.", "Numbered item"),
        wordListParagraph(1, SYMBOL_BULLET, "Bulleted item"),
      ],
      '<ol><li value="1">Numbered item</li></ol><ul><li value="1">Bulleted item</li></ul>',
    )
  })
})

test.describe("Paste a Word/Outlook list copied out of context", () => {
  // This is the shape that made the pasted result look absurdly deep: copying a
  // fragment out of the middle of a document yields paragraphs that all declare
  // level3 with no level1 or level2 above them.
  test("anchors a selection copied from deep inside a list at the top level", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [
        wordListParagraph(3, WINGDINGS_BULLET, "First item", { font: "Wingdings" }),
        wordListParagraph(3, WINGDINGS_BULLET, "Second item", { font: "Wingdings" }),
        wordListParagraph(4, SYMBOL_BULLET, "Nested item"),
      ],
      '<ul><li value="1">First item</li><li value="2">Second item' +
        '<ul><li value="1">Nested item</li></ul></li></ul>',
    )
  })

  test("starts a separate list for each run split by a plain paragraph", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [
        wordListParagraph(1, SYMBOL_BULLET, "First item"),
        wordParagraph("An explanation"),
        wordListParagraph(1, SYMBOL_BULLET, "Second item"),
      ],
      '<ul><li value="1">First item</li></ul><p>An explanation</p>' +
        '<ul><li value="1">Second item</li></ul>',
    )
  })

  test("leaves paragraphs that declare no list level alone", async ({ page, editor }) => {
    await assertWordPasteBecomes(
      page,
      editor,
      [
        `<p class=MsoNormal style='margin-left:.5in;mso-list:none'>Not a list item<o:p></o:p></p>`,
        wordParagraph("Another paragraph"),
      ],
      "<p>Not a list item</p><p>Another paragraph</p>",
    )
  })
})

test.describe("Paste a Word/Outlook list — leftovers", () => {
  test("drops the marker glyphs and Word's indentation", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    startMonitoringConsole(page)

    await editor.setValue("<p></p>")
    await editor.focus()

    await editor.paste("ignored", {
      html: wordDocument(
        wordListParagraph(1, "1.", "First item"),
        wordListParagraph(2, COURIER_BULLET, "Nested item", { font: "Courier New" }),
        wordListParagraph(3, WINGDINGS_BULLET, "Deeply nested item", { font: "Wingdings" }),
      ),
    })
    await editor.flush()

    const value = await editor.value()
    expect(value).not.toContain(SYMBOL_BULLET)
    expect(value).not.toContain(WINGDINGS_BULLET)
    expect(value).not.toContain("margin-left")
    expect(value).not.toContain("text-indent")
    expect(value).not.toContain("mso-list")
    expect(value).not.toContain("&nbsp;")
    expect(page).toHaveNoErrors()
  })
})
