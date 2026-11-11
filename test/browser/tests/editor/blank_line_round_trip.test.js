import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

// Saving a document and opening it again must not change it. Browsers draw
// nothing for a <br> that ends a block, and Lexical drops one on import, so the
// value keeps the extra <br> Lexical exports after a block's trailing line break.
// Trix writes a blank line as <div><br></div>, which loads as an empty paragraph.
async function roundTrip(editor, html) {
  await editor.setValue(html)
  await editor.flush()
  return await editor.value()
}

test.describe("Blank lines across save and reload", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("a Trix blank line loads as an empty paragraph", async ({ editor }) => {
    expect(await roundTrip(editor, "<div>A</div><div><br></div><div>B</div>")).toBe("<p>A</p><p><br></p><p>B</p>")
  })

  test("consecutive Trix blank lines load as empty paragraphs", async ({ editor }) => {
    expect(await roundTrip(editor, "<div>A</div><div><br></div><div><br></div><div>B</div>"))
      .toBe("<p>A</p><p><br></p><p><br></p><p>B</p>")
  })

  test("a Trix block that ends in a blank line keeps it", async ({ editor }) => {
    expect(await roundTrip(editor, "<div>A<br>B<br><br></div><div><br></div><h1>H</h1>"))
      .toBe("<p>A<br>B<br><br></p><p><br></p><h1>H</h1>")
  })

  test("a Trix block with text and line breaks is unchanged", async ({ editor }) => {
    expect(await roundTrip(editor, "<div>A<br>B</div><div>C</div>")).toBe("<p>A<br>B</p><p>C</p>")
  })

  test("trailing line breaks in a paragraph survive repeated round trips", async ({ editor }) => {
    const html = "<p>C<br><br><br></p><p>D</p>"

    let value = html
    for (let i = 0; i < 3; i++) value = await roundTrip(editor, value)

    expect(value).toBe(html)
  })

  for (const [ name, block ] of [ [ "paragraph", "p" ], [ "heading", "h2" ], [ "quote", "blockquote" ] ]) {
    test(`a Shift+Enter at the end of a ${name} survives a round trip`, async ({ editor }) => {
      await editor.setValue(`<${block}>First</${block}><p>Second</p>`)
      await editor.flush()

      await editor.placeCaretInside("First", "First".length)
      await editor.send("Shift+Enter")

      const saved = await editor.value()
      expect(saved).toBe(`<${block}>First<br><br></${block}><p>Second</p>`)

      expect(await roundTrip(editor, saved)).toBe(saved)
      await assertEditorHtml(editor, saved)
    })
  }

  test("an empty paragraph stays one empty paragraph", async ({ editor }) => {
    expect(await roundTrip(editor, "<p>A</p><p><br></p><p>B</p>")).toBe("<p>A</p><p><br></p><p>B</p>")
  })
})
