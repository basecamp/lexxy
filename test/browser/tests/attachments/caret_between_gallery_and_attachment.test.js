import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorBlocks, assertEditorContent } from "../../helpers/assertions.js"

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

  test("delete at gallery end does not reach across a paragraph the user wrote", async ({ editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${IMAGE("one")}${IMAGE("two")}</div><p><br></p>${IMAGE("three")}`)
    await editor.flush()

    await placeCaretInGallery(editor, "end")
    await editor.send("Delete")

    await assertAttachmentStaysOutsideGallery(editor)
  })

  test("backspace at gallery start does not reach across a paragraph the user wrote", async ({ editor }) => {
    await editor.setValue(`${IMAGE("three")}<p><br></p><div class="attachment-gallery">${IMAGE("one")}${IMAGE("two")}</div>`)
    await editor.flush()

    await placeCaretInGallery(editor, "start")
    await editor.send("Backspace")

    await assertAttachmentStaysOutsideGallery(editor)
  })
})

async function placeCaretInGallery(editor, edge) {
  await editor.locator.evaluate((el, edge) => {
    return new Promise((resolve) => {
      el.editor.update(() => {
        const root = el.editor.getEditorState()._nodeMap.get("root")
        const gallery = root.getChildren().find((child) => child.getType() === "image_gallery")
        let offset = 0
        if (edge === "end") offset = gallery.getChildrenSize()
        gallery.select(offset, offset)
      }, { onUpdate: resolve })
    })
  }, edge)
}

async function assertAttachmentStaysOutsideGallery(editor) {
  await assertEditorContent(editor, async (content) => {
    await expect(content.locator(".attachment-gallery figure.attachment")).toHaveCount(2)
    await expect(content.locator("figure.attachment")).toHaveCount(3)
  })
}
