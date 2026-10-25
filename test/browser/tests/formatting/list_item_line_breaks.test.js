import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Line breaks inside list items", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("a Shift+Enter line break at the end of a list item survives a value round-trip", async ({ editor }) => {
    await editor.setValue("<ul><li value=\"1\">First</li><li value=\"2\">Second</li><li value=\"3\">Third</li></ul>")
    await editor.flush()

    await editor.placeCaretInside("First", "First".length)
    await editor.send("Shift+Enter")

    const saved = await editor.value()
    expect(saved).toContain("<br>")

    await editor.setValue(saved)
    await editor.flush()

    await assertEditorHtml(editor, saved)
  })

  test("importing a list item with a trailing line break keeps it", async ({ editor }) => {
    await editor.setValue("<ul><li value=\"1\">First<br></li><li value=\"2\">Second</li></ul>")
    await editor.flush()

    await assertEditorHtml(editor, "<ul><li value=\"1\">First<br></li><li value=\"2\">Second</li></ul>")
  })

  test("importing a list item with a blank line keeps it", async ({ editor }) => {
    await editor.setValue("<ul><li value=\"1\">First<br><br></li><li value=\"2\">Second</li></ul>")
    await editor.flush()

    await assertEditorHtml(editor, "<ul><li value=\"1\">First<br><br></li><li value=\"2\">Second</li></ul>")
  })

  test("a filler line break preceded only by whitespace is still dropped", async ({ editor }) => {
    await editor.setValue("<ul><li value=\"1\">\n    <br></li><li value=\"2\">Second</li></ul>")
    await editor.flush()

    await assertEditorHtml(editor, "<ul><li value=\"1\"></li><li value=\"2\">Second</li></ul>")
  })

  test("a filler line break in an empty list item is still dropped", async ({ editor }) => {
    await editor.setValue("<ul><li value=\"1\"><br></li><li value=\"2\">Second</li></ul>")
    await editor.flush()

    await assertEditorHtml(editor, "<ul><li value=\"1\"></li><li value=\"2\">Second</li></ul>")
  })

  test("pasting a list keeps a line break inside an item and drops the trailing filler", async ({ editor }) => {
    await editor.setValue("<p></p>")
    await editor.focus()

    await editor.paste("ignored", { html: "<ul><li>First<br>line</li><li>Second<br></li></ul>" })
    await editor.flush()

    await assertEditorHtml(editor, "<ul><li value=\"1\">First<br>line</li><li value=\"2\">Second</li></ul>")
  })
})
