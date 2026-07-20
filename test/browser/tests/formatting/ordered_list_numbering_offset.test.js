import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Ordered list with a numbering offset loaded as initial value", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("preserves numbering from the ol start attribute", async ({ page, editor }) => {
    await editor.setValue("<ol start=\"2\"><li value=\"2\">Should be 2</li><li value=\"3\">Should be 3</li></ol>")
    await editor.flush()

    await assertEditorHtml(
      editor,
      '<ol start="2"><li value="2">Should be 2</li><li value="3">Should be 3</li></ol>'
    )
  })
})
