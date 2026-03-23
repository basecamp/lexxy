import { test } from "../test_helper.js"
import { assertEditorHtml } from "../helpers/assertions.js"

test.describe("Trix HTML", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test.describe("load trix html", () => {
    test("heading", async ({ editor }) => {
      await editor.setValue("<div><h1>Title</h1></div>")
      await assertEditorHtml(editor, "<h1>Title</h1>")
    })

    test("heading with colored span", async ({ editor }) => {
      await editor.setValue('<div><h1><span style="color: purple;">Purple subtitle</span></h1></div>')
      await assertEditorHtml(editor, '<h1><mark style="color: purple;">Purple subtitle</mark></h1>')
    })

    test("pre with language text", async ({ editor }) => {
      await editor.setValue('<div><pre language="text"><span style="color: red;">def ruby</span></pre></div>')
      await assertEditorHtml(editor, '<pre data-language="plain" data-highlight-language="plain">def ruby</pre>')
    })

    test("pre with language javascript", async ({ editor }) => {
      await editor.setValue('<div><pre language="javascript">const language = "js"</pre></div>')
      await assertEditorHtml(editor, '<pre data-language="js" data-highlight-language="js">const language = "js"</pre>')
    })
  })

  test.describe("load trix html p children", () => {
    test("span with color", async ({ editor }) => {
      await editor.setValue('<div><span style="color: red;">red color</span></div>')
      await assertEditorHtml(editor, '<p><mark style="color: red;">red color</mark></p>')
    })

    test("span with background-color", async ({ editor }) => {
      await editor.setValue('<div><span style="background-color: blue;">blue background</span></div>')
      await assertEditorHtml(editor, '<p><mark style="background-color: blue;">blue background</mark></p>')
    })

    test("span with color and background-color", async ({ editor }) => {
      await editor.setValue('<div><span style="color: darkgreen;background-color: green;">green everything</span></div>')
      await assertEditorHtml(editor, '<p><mark style="color: darkgreen;background-color: green;">green everything</mark></p>')
    })

    test("del", async ({ editor }) => {
      await editor.setValue("<div><del>corrected</del></div>")
      await assertEditorHtml(editor, "<p><s>corrected</s></p>")
    })

    test("strong del", async ({ editor }) => {
      await editor.setValue("<div><strong><del>wrong!</del></strong></div>")
      await assertEditorHtml(editor, "<p><s><strong>wrong!</strong></s></p>")
    })

    test("del with color", async ({ editor }) => {
      await editor.setValue('<div><del style="color: red;">deleted</del></div>')
      await assertEditorHtml(editor, '<p><s><mark style="color: red;">deleted</mark></s></p>')
    })

    test("strong with color", async ({ editor }) => {
      await editor.setValue('<div><strong style="color: yellow;">banana</strong></div>')
      await assertEditorHtml(editor, '<p><mark style="color: yellow;"><strong>banana</strong></mark></p>')
    })

    test("em with color", async ({ editor }) => {
      await editor.setValue('<div><em style="color: blue;">wave</em></div>')
      await assertEditorHtml(editor, '<p><mark style="color: blue;"><em>wave</em></mark></p>')
    })
  })

  test.describe("load trix html with image attachment", () => {
    test("extracts attachment from paragraph", async ({ editor }) => {
      await editor.setValue(
        '<div>Hello Trix <action-text-attachment content-type="image/png"></action-text-attachment></div>'
      )

      await assertEditorHtml(
        editor,
        '<p>Hello Trix</p><action-text-attachment alt="" caption="" content-type="image/png" filename="" presentation="gallery"></action-text-attachment>'
      )
    })
  })
})
