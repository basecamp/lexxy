import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("List item deletion cursor position", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("backspace on empty first list item converts it to a paragraph", async ({
    editor,
  }) => {
    // Set up a bullet list with one item
    await editor.setValue("<ul><li value=\"1\">Some text</li></ul>")
    await editor.flush()

    // Place cursor at the very start of "Some text"
    await editor.content.locator("ul li").first().click()
    await editor.send("Home")
    await editor.flush()

    // Press Enter to create a blank list item above, pushing "Some text" down
    await editor.send("Enter")
    await editor.flush()

    // Now we have two list items: an empty one at position 0, and "Some text" at position 1.
    // Move cursor up to the empty/first list item.
    await editor.send("ArrowUp")
    await editor.flush()

    // Press Backspace on the empty first list item.
    // Expected: the empty list item is converted to an empty paragraph above the list.
    await editor.send("Backspace")
    await editor.flush()

    await assertEditorHtml(editor, "<p><br></p><ul><li value=\"1\">Some text</li></ul>")

    // Type a marker character to verify cursor position.
    // Cursor should be in the new paragraph, so marker appears there.
    await editor.send("X")
    await editor.flush()

    await assertEditorHtml(editor, "<p>X</p><ul><li value=\"1\">Some text</li></ul>")
  })

  test("backspace on empty first list item with paragraph above converts to paragraph", async ({
    editor,
  }) => {
    // Set up content before the list, then a list
    await editor.setValue(
      "<p>Paragraph above</p><ul><li value=\"1\">List item text</li></ul>",
    )
    await editor.flush()

    // Place cursor at the start of the list item text
    await editor.content.locator("ul li").first().click()
    await editor.send("Home")
    await editor.flush()

    // Press Enter to create a blank list item above
    await editor.send("Enter")
    await editor.flush()

    // Move cursor up to the newly created empty first list item
    await editor.send("ArrowUp")
    await editor.flush()

    // Delete the empty list item — it should become a paragraph
    await editor.send("Backspace")
    await editor.flush()

    // Type a marker to check cursor position.
    // The marker should appear in the new paragraph between "Paragraph above" and the list.
    await editor.send("X")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<p>Paragraph above</p><p>X</p><ul><li value=\"1\">List item text</li></ul>",
    )
  })

  test("deleting empty middle list item keeps cursor in the list", async ({
    editor,
  }) => {
    // Set up a bullet list with two items
    await editor.setValue(
      "<ul><li value=\"1\">First item</li><li value=\"2\">Second item</li></ul>",
    )
    await editor.flush()

    // Place cursor at the start of "Second item"
    await editor.content.locator("ul li").nth(1).click()
    await editor.send("Home")
    await editor.flush()

    // Press Enter to create a blank list item between First and Second
    await editor.send("Enter")
    await editor.flush()

    // Move cursor up to the empty middle list item
    await editor.send("ArrowUp")
    await editor.flush()

    // Delete the empty middle list item by pressing Backspace.
    // This should remove it and leave cursor at the end of "First item".
    await editor.send("Backspace")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<ul><li value=\"1\">First item</li><li value=\"2\">Second item</li></ul>",
    )

    // Type a marker to verify cursor is at the end of "First item"
    await editor.send("X")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<ul><li value=\"1\">First itemX</li><li value=\"2\">Second item</li></ul>",
    )
  })
})
