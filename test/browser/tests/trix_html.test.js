import { test } from "../test_helper.js"
import { assertEditorHtml } from "../helpers/assertions.js"

test.describe("Trix HTML", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("load HTML with image attachment extracts it from paragraph", async ({ editor }) => {
    await editor.setValue(
      '<div>Hello Trix <action-text-attachment content-type="image/png"></action-text-attachment></div>'
    )

    await assertEditorHtml(
      editor,
      '<p>Hello Trix</p><action-text-attachment alt="" caption="" content-type="image/png" filename="" presentation="gallery"></action-text-attachment>'
    )
  })
})
