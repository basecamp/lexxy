import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { HELLO_EVERYONE, clickToolbarButton, applyHighlightOption } from "../../helpers/toolbar.js"

test.describe("Clear formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("removes bold", async ({ page, editor }) => {
    await editor.setValue("<p>Hello <strong>everyone</strong></p>")
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("removes italic", async ({ page, editor }) => {
    await editor.setValue("<p>Hello <em>everyone</em></p>")
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("removes strikethrough", async ({ page, editor }) => {
    await editor.setValue("<p>Hello <s>everyone</s></p>")
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("removes underline", async ({ page, editor }) => {
    await editor.setValue("<p>Hello <u>everyone</u></p>")
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("removes link", async ({ page, editor }) => {
    await editor.setValue('<p>Hello <a href="https://example.com">everyone</a></p>')
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("removes color highlight", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await applyHighlightOption(page, "color", 1)
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("removes background highlight", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await applyHighlightOption(page, "background-color", 1)
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("converts heading to paragraph", async ({ page, editor }) => {
    await editor.setValue("<h2>Hello everyone</h2>")
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("unwraps blockquote", async ({ page, editor }) => {
    await editor.setValue("<blockquote><p>Hello everyone</p></blockquote>")
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("unwraps code block", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain" data-highlight-language="plain">Hello everyone</pre>')
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("unwraps bullet list", async ({ page, editor }) => {
    await editor.setValue("<ul><li>Hello everyone</li></ul>")
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("unwraps numbered list", async ({ page, editor }) => {
    await editor.setValue("<ol><li>Hello everyone</li></ol>")
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("removes all formatting at once", async ({ page, editor }) => {
    await editor.setValue(
      '<h2>Heading</h2><p>Hello <strong><em>bold italic</em></strong> and <a href="https://example.com">link</a></p><blockquote><p>quoted</p></blockquote><ul><li>listed</li></ul>',
    )
    await editor.selectAll()
    await clickToolbarButton(page, "clearFormatting")
    await assertEditorHtml(
      editor,
      "<p>Heading</p><p>Hello bold italic and link</p><p>quoted</p><p>listed</p>",
    )
  })
})
