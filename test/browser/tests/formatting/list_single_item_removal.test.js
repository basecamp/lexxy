import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Removing list formatting from a single item", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("toggling the bullet button on one item removes the bullet from only that item", async ({ editor }) => {
    await editor.setValue("<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>")
    await editor.select("Second item")

    await editor.clickToolbarButton("insertUnorderedList")

    await assertEditorHtml(
      editor,
      '<ul><li value="1">First item</li></ul><p>Second item</p><ul><li value="1">Third item</li></ul>',
    )
  })

  test("toggling the numbered button on one item removes the number from only that item", async ({ editor }) => {
    await editor.setValue("<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>")
    await editor.select("Second item")

    await editor.clickToolbarButton("insertOrderedList")

    await assertEditorHtml(
      editor,
      '<ol><li value="1">First item</li></ol><p>Second item</p><ol><li value="1">Third item</li></ol>',
    )
  })
})
