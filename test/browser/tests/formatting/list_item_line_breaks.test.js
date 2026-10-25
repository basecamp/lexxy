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
    expect(saved).toBe("<ul><li value=\"1\">First<br><br></li><li value=\"2\">Second</li><li value=\"3\">Third</li></ul>")

    await editor.setValue(saved)
    await editor.flush()

    await assertEditorHtml(editor, saved)
  })

  test("a Shift+Enter line break in an empty list item survives a value round-trip", async ({ editor }) => {
    await editor.setValue("<ul><li value=\"1\">First</li></ul>")
    await editor.flush()

    await editor.placeCaretInside("First", "First".length)
    await editor.send("Enter")
    await editor.send("Shift+Enter")

    const saved = await editor.value()
    expect(saved).toBe("<ul><li value=\"1\">First</li><li value=\"2\"><br><br></li></ul>")

    await editor.setValue(saved)
    await editor.flush()

    await assertEditorHtml(editor, saved)
  })

  test("a list item saved with a trailing line break loads it once", async ({ editor }) => {
    await editor.setValue("<ol><li value=\"1\">First<br><br></li><li value=\"2\">Second</li></ol>")
    await editor.flush()

    await assertEditorHtml(editor, "<ol><li value=\"1\">First<br><br></li><li value=\"2\">Second</li></ol>")
  })

  test("a filler line break in an empty list item is still dropped", async ({ editor }) => {
    await editor.setValue("<ul><li value=\"1\"><br></li><li value=\"2\">Second</li></ul>")
    await editor.flush()

    await assertEditorHtml(editor, "<ul><li value=\"1\"></li><li value=\"2\">Second</li></ul>")
  })

  test("a line break inside a nested list item survives a value round-trip", async ({ editor }) => {
    await editor.setValue("<ul><li value=\"1\">Parent</li><li value=\"2\"><ul><li value=\"1\">Child</li></ul></li></ul>")
    await editor.flush()

    await editor.placeCaretInside("Child", "Child".length)
    await editor.send("Shift+Enter")

    const saved = await editor.value()
    expect(saved).toContain("<li value=\"1\">Child<br><br></li>")

    await editor.setValue(saved)
    await editor.flush()

    await assertEditorHtml(editor, saved)
  })
})
