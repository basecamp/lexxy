import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Ordered list loaded as initial value", () => {
  test("numbers list items sequentially", async ({ page, editor }) => {
    await page.goto("/initial-value-ordered-list.html")
    await editor.waitForConnected()

    await assertEditorHtml(
      editor,
      '<ol><li value="1">First</li><li value="2">Second</li><li value="3">Third</li></ol>'
    )
  })
})
