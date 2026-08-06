import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

// Word and Outlook declare paragraph spacing in the style sheet they put on
// the clipboard (p.MsoNormal { margin: 0in; ... }), never inline. The pasted
// content formatter drops foreign style sheets, so without inlining those
// margins first the paragraphs arrive with unknown spacing and hosts that
// convert paragraph margins into blank lines multiply every line break.
//
// The sheet below is the one Outlook ships when composing a mail: tight
// MsoNormal paragraphs, and an explicit empty paragraph for each blank line
// the author typed.
const OUTLOOK_STYLE_SHEET = `<style><!--
p.MsoNormal, li.MsoNormal, div.MsoNormal
\t{margin:0in;
\tfont-size:12.0pt;
\tfont-family:"Aptos",sans-serif;}
p.MsoListParagraph, li.MsoListParagraph, div.MsoListParagraph
\t{mso-style-priority:34;
\tmargin-top:0in;
\tmargin-right:0in;
\tmargin-bottom:0in;
\tmargin-left:.5in;
\tfont-size:12.0pt;
\tfont-family:"Aptos",sans-serif;}
@page WordSection1
\t{size:8.5in 11.0in;
\tmargin:1.0in 1.0in 1.0in 1.0in;}
div.WordSection1
\t{page:WordSection1;}
--></style>`

const LIST_MARKER =
  `<![if !supportLists]><span style='font-family:Symbol;mso-fareast-font-family:Symbol'>` +
  `<span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>` +
  `</span></span><![endif]>`

function outlookDocument(...body) {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=Generator content="Microsoft Word 15 (filtered medium)">
${OUTLOOK_STYLE_SHEET}
</head>
<body lang=EN-US style='word-wrap:break-word'>
<div class=WordSection1>
${body.join("\n\n")}
</div>
</body>
</html>`
}

// A faithful reduction of the payload a customer's classic Outlook actually put
// on the clipboard (card 10162259021). It differs from the composed-mail shape
// above in three ways: the sheet declares spacing with the `margin` shorthand in
// centimetres rather than per-side in inches, the list arrives as real ul/li
// elements rather than Word's fake mso-list paragraphs, and Word breaks lines
// inside the <o:p> tags, so the markup carries literal newlines.
function capturedOutlookMail() {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=Generator content="Microsoft Word 15 (filtered medium)">
<style><!--
p.MsoNormal, li.MsoNormal, div.MsoNormal
\t{mso-style-parent:"";
\tmargin:0cm;
\tfont-size:11.0pt;
\tfont-family:"Aptos",sans-serif;}
p.MsoListParagraph, li.MsoListParagraph, div.MsoListParagraph
\t{mso-style-priority:34;
\tmargin-top:0cm;
\tmargin-right:0cm;
\tmargin-bottom:0cm;
\tmargin-left:36.0pt;
\tfont-size:11.0pt;
\tfont-family:"Aptos",sans-serif;}
ul
\t{margin-bottom:0cm;}
div.WordSection1
\t{page:WordSection1;}
--></style>
</head>
<body lang=EN-GB style='word-wrap:break-word'>
<div class=WordSection1>
<p class=MsoNormal>This is a line of test text.<o:p>
</o:p>
</p>

<p class=MsoNormal>
<o:p>&nbsp;</o:p>
</p>

<ul style='margin-top:0cm' type=disc>
 <li class=MsoListParagraph style='margin-left:0cm;mso-list:l0 level1 lfo1'>This<o:p>
</o:p>
</li>
 <li class=MsoListParagraph style='margin-left:0cm;mso-list:l0 level1 lfo1'>Is<o:p>
</o:p>
</li>
</ul>

<p class=MsoNormal>
<o:p>&nbsp;</o:p>
</p>

<p class=MsoNormal>Another line of text.<o:p>
</o:p>
</p>
</div>
</body>
</html>`
}

async function formattedBodyHtml(page, html) {
  await page.goto("/pasted-content-formatter.html")
  return page.evaluate((pastedHtml) => {
    const doc = new DOMParser().parseFromString(pastedHtml, "text/html")
    new window.PastedContentFormatter(doc).format()
    return doc.body.innerHTML
  }, html)
}

test.describe("Office paragraph margins", () => {
  test("inlines the sheet's vertical margins onto paragraphs before the sheet is stripped", async ({ page }) => {
    const bodyHtml = await formattedBodyHtml(
      page,
      outlookDocument(
        `<p class=MsoNormal>Line one<o:p></o:p></p>`,
        `<p class=MsoNormal><o:p>&nbsp;</o:p></p>`,
        `<p class=MsoNormal>Line two<o:p></o:p></p>`,
      ),
    )

    expect(bodyHtml).toContain(`<p class="MsoNormal" style="margin-top:0in;margin-bottom:0in">Line one<o:p></o:p></p>`)
    expect(bodyHtml).toContain(`<p class="MsoNormal" style="margin-top:0in;margin-bottom:0in"><o:p>&nbsp;</o:p></p>`)
  })

  test("keeps margins the paragraph already declares inline", async ({ page }) => {
    const bodyHtml = await formattedBodyHtml(
      page,
      outlookDocument(`<p class=MsoNormal style='margin-bottom:12.0pt'>Spaced out<o:p></o:p></p>`),
    )

    expect(bodyHtml).toContain(`style="margin-bottom:12.0pt;margin-top:0in"`)
  })

  test("leaves paragraphs untouched when the document has no style sheet", async ({ page }) => {
    const bodyHtml = await formattedBodyHtml(page, `<p>Plain paragraph</p>`)

    expect(bodyHtml).toBe(`<p>Plain paragraph</p>`)
  })

  test("skips a property the matching rules disagree on", async ({ page }) => {
    const bodyHtml = await formattedBodyHtml(
      page,
      `<html><head><style>
        p.MsoNormal { margin-top: 0cm; margin-bottom: 0cm }
        p { margin-top: 12.0pt; margin-bottom: 12.0pt }
      </style></head><body><p class=MsoNormal>Ambiguous</p></body></html>`,
    )

    expect(bodyHtml).toBe(`<p class="MsoNormal">Ambiguous</p>`)
  })

  test("inlines a property the matching rules agree on", async ({ page }) => {
    const bodyHtml = await formattedBodyHtml(
      page,
      `<html><head><style>
        p.MsoNormal { margin-top: 0cm }
        p { margin-top: 0cm }
      </style></head><body><p class=MsoNormal>Tight</p></body></html>`,
    )

    expect(bodyHtml).toBe(`<p class="MsoNormal" style="margin-top:0cm">Tight</p>`)
  })

  test("does not apply margins declared outside style rules, like @page", async ({ page }) => {
    const bodyHtml = await formattedBodyHtml(
      page,
      `<html><head><style>@page Section { margin: 1.0in; }</style></head><body><p>Text</p></body></html>`,
    )

    expect(bodyHtml).toBe(`<p>Text</p>`)
  })

  test("still rebuilds Word's lists after inlining margins onto list paragraphs", async ({ page }) => {
    const bodyHtml = await formattedBodyHtml(
      page,
      outlookDocument(
        `<p class=MsoListParagraph style='text-indent:-.25in;mso-list:l0 level1 lfo1'>${LIST_MARKER}First<o:p></o:p></p>`,
        `<p class=MsoListParagraph style='text-indent:-.25in;mso-list:l0 level1 lfo1'>${LIST_MARKER}Second<o:p></o:p></p>`,
      ),
    )

    expect(bodyHtml).toContain("<ul><li>")
    expect(bodyHtml).not.toContain("MsoListParagraph")
  })
})

test.describe("Paste an Outlook mail", () => {
  test("keeps the author's paragraphs and blank lines one to one", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    startMonitoringConsole(page)

    await editor.setValue("<p></p>")
    await editor.focus()

    await editor.paste("ignored", {
      html: outlookDocument(
        `<p class=MsoNormal>Line one<o:p></o:p></p>`,
        `<p class=MsoNormal><o:p>&nbsp;</o:p></p>`,
        `<p class=MsoNormal>Line two<o:p></o:p></p>`,
      ),
    })
    await editor.flush()

    await assertEditorHtml(editor, "<p>Line one</p><p>&nbsp;</p><p>Line two</p>")
    expect(await editor.value()).not.toContain("margin")
    expect(page).toHaveNoErrors()
  })
})

test.describe("Captured Outlook payload", () => {
  test("inlines margins the sheet declares with the shorthand in centimetres", async ({ page }) => {
    const bodyHtml = await formattedBodyHtml(page, capturedOutlookMail())

    expect(bodyHtml).toContain(`<p class="MsoNormal" style="margin-top:0cm;margin-bottom:0cm">This is a line of test text.`)
  })

  // Guards the whole import rather than the margin inlining alone. The payload's
  // literal newlines are collapsed as ordinary HTML whitespace, which is what
  // keeps them away from the line-separator transform; were they ever to survive
  // as text, that transform would turn each one into a break. Pin the imported
  // structure so a blank line the author never typed cannot creep back in.
  test("imports with the author's paragraphs and blank lines one to one", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    startMonitoringConsole(page)

    await editor.setValue("<p></p>")
    await editor.focus()

    await editor.paste("ignored", { html: capturedOutlookMail() })
    await editor.flush()

    await assertEditorHtml(
      editor,
      `<p>This is a line of test text.</p><p>&nbsp;</p><ul><li value="1">This</li><li value="2">Is</li></ul><p>&nbsp;</p><p>Another line of text.</p>`,
    )
    expect(page).toHaveNoErrors()
  })
})
