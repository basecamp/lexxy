import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("List item deletion cursor position", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("deleting empty first list item keeps cursor in the list", async ({
    page,
    editor,
  }) => {
    // Set up a bullet list with one item
    await editor.setValue("<ul><li>Some text</li></ul>")
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

    // Delete the empty first list item by pressing Backspace.
    // This should merge it with the item below or remove it,
    // leaving cursor at the start of "Some text".
    await editor.send("Backspace")
    await editor.flush()

    // The list should still contain "Some text"
    await assertEditorHtml(editor, "<ul><li>Some text</li></ul>")

    // Type a marker character to verify cursor position.
    // If cursor is correctly at the start of the list item,
    // the marker should appear before "Some text".
    await editor.send("X")
    await editor.flush()

    await assertEditorHtml(editor, "<ul><li>XSome text</li></ul>")
  })

  test("deleting empty first list item does not jump cursor to document root", async ({
    page,
    editor,
  }) => {
    // Set up content before the list, then a list
    await editor.setValue(
      "<p>Paragraph above</p><ul><li>List item text</li></ul>",
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

    // Delete the empty list item
    await editor.send("Backspace")
    await editor.flush()

    // Type a marker to check cursor position.
    // The marker should appear at the start of "List item text",
    // NOT at the top of the document or in the paragraph above.
    await editor.send("X")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<p>Paragraph above</p><ul><li>XList item text</li></ul>",
    )
  })
})
