import { test } from "../../test_helper.js"
import { assertEditorBlocks } from "../../helpers/assertions.js"

const IMAGE = (name) => `<action-text-attachment content-type="image/png" url="http://example.com/${name}.png" filename="${name}.png" width="100" height="100"></action-text-attachment>`

test.describe("Caret between a gallery and the attachment below it", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("types a paragraph between a gallery and the attachment below it", async ({ editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${IMAGE("one")}${IMAGE("two")}${IMAGE("three")}</div>${IMAGE("four")}`)
    await editor.flush()

    await editor.content.locator(".attachment-gallery + p").click()
    await editor.send("between")

    await assertEditorBlocks(editor, [ "div", "p:between", "action-text-attachment" ])
  })

  test("types a paragraph between an attachment and the gallery below it", async ({ editor }) => {
    await editor.setValue(`${IMAGE("one")}<div class="attachment-gallery">${IMAGE("two")}${IMAGE("three")}${IMAGE("four")}</div>`)
    await editor.flush()

    await editor.content.locator("figure.attachment + p").click()
    await editor.send("between")

    await assertEditorBlocks(editor, [ "action-text-attachment", "p:between", "div" ])
  })
})
