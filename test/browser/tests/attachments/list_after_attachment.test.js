import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

test.describe("List: backspace on list item after attachment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("backspace converts empty list item to paragraph instead of selecting attachment", async ({ editor }) => {
    await editor.setValue(
      '<action-text-attachment content-type="image/png" url="http://example.com/image.png" filename="photo.png"></action-text-attachment>' +
      "<ol><li><br></li></ol>",
    )

    // Click on the empty list item
    await editor.content.locator("ol li").click()
    await editor.flush()

    // Backspace should remove the list item and convert to paragraph,
    // NOT select the attachment
    await editor.send("Backspace")
    await editor.flush()

    // The list should be gone
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("ol")).toHaveCount(0)
    })

    // The attachment should NOT be selected (no node--selected class)
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("figure.node--selected")).toHaveCount(0)
    })
  })

  test("backspace on empty first list item after clearing text does not select attachment", async ({ editor }) => {
    await editor.setValue(
      '<action-text-attachment content-type="image/png" url="http://example.com/image.png" filename="photo.png"></action-text-attachment>' +
      "<ol><li>Item</li></ol>",
    )

    // Click on the list item text
    await editor.content.locator("ol li").click()
    await editor.flush()

    // Select all text in the list item and delete it
    await editor.send("Home")
    await editor.send("Shift+End")
    await editor.send("Backspace")
    await editor.flush()

    // Now backspace on the empty list item
    await editor.send("Backspace")
    await editor.flush()

    // The list should be gone
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("ol")).toHaveCount(0)
    })

    // The attachment should NOT be selected
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("figure.node--selected")).toHaveCount(0)
    })
  })
})
