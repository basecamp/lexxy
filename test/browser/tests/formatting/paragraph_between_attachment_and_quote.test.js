import { test } from "../../test_helper.js"
import { assertEditorBlocks } from "../../helpers/assertions.js"

const ATTACHMENT = '<action-text-attachment content-type="image/png" url="http://example.com/image.png" filename="photo.png" width="100" height="100"></action-text-attachment>'

test.describe("Caret between an attachment and the block container below it", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("types a paragraph between an attachment and a quote", async ({ editor }) => {
    await editor.setValue(`${ATTACHMENT}<blockquote><p>quoted</p></blockquote><p>trailing</p>`)
    await editor.flush()

    await editor.content.locator("figure.attachment + p").click()
    await editor.send("between")

    await assertEditorBlocks(editor, [ "action-text-attachment", "p:between", "blockquote:quoted", "p:trailing" ])
  })

  test("types a paragraph between an attachment and a list", async ({ editor }) => {
    await editor.setValue(`${ATTACHMENT}<ul><li>listed</li></ul>`)
    await editor.flush()

    await editor.content.locator("figure.attachment + p").click()
    await editor.send("between")

    await assertEditorBlocks(editor, [ "action-text-attachment", "p:between", "ul:listed" ])
  })
})
