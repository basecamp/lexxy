import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { attachmentTag, selectAttachment } from "../../helpers/attachment_helpers.js"

test.describe("Attachment alternative text", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.route("**/*.png", (route) => route.fulfill({ path: "test/fixtures/files/example.png", contentType: "image/png" }))
    await page.goto("/attachments.html")
    await editor.waitForConnected()
  })

  for (const { name, caption, alt, announcement } of [
    { name: "distinct caption and description", caption: "On the river", alt: "A red canoe passes green trees", announcement: "On the river. A red canoe passes green trees" },
    { name: "description matching the caption", caption: "A red canoe", alt: "A red canoe", announcement: "A red canoe" },
    { name: "filename used as alternative text", caption: "On the river", alt: "canoe.png", announcement: "On the river" },
    { name: "description without a caption", caption: "", alt: "A red canoe", announcement: "A red canoe" },
    { name: "filename without a caption", caption: "", alt: "canoe.png", announcement: "canoe.png" },
    { name: "caption without alternative text", caption: "On the river", alt: "", announcement: "On the river" }
  ]) {
    test(`selects and announces ${name}`, async ({ page, editor }) => {
      await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "whale.png")}${attachmentTag("b", "canoe.png", { caption, alt })}</div>`)
      await editor.flush()

      const figure = page.locator("figure.attachment").nth(1)
      await expect(figure).not.toHaveClass(/node--selected/)
      await expect(figure.locator("img")).toHaveAttribute("alt", alt)
      await expect(figure.locator(".attachment__caption-text")).toHaveText(caption || "canoe.png")

      await selectAttachment(figure)
      await editor.focus()
      await expect(figure.locator(".lexxy-fake-selection")).toHaveText(announcement)
      await expect.poll(() => page.evaluate(() => document.getSelection().toString())).toBe(announcement)

      await page.evaluate(() => {
        window.__lexxyAriaNotifications = []
        document.ariaNotify = (message) => window.__lexxyAriaNotifications.push(message)
      })
      await page.keyboard.press("ArrowLeft")
      await editor.flush()

      expect(await page.evaluate(() => window.__lexxyAriaNotifications)).toEqual([ announcement ])
    })
  }

  test("syncs changed and cleared alternative text to the displayed image", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "canoe.png", { caption: "On the river", alt: "A red canoe" }))
    await editor.flush()

    for (const alt of [ "A blue canoe", "" ]) {
      await editor.locator.evaluate((element, alt) => {
        return new Promise((resolve) => {
          element.editor.update(() => {
            for (const node of element.editor.getEditorState()._nodeMap.values()) {
              if (node.__type === "action_text_attachment") node.getWritable().altText = alt
            }
          }, { onUpdate: resolve })
        })
      }, alt)
      await editor.flush()

      await expect(page.locator("figure.attachment img")).toHaveAttribute("alt", alt)
      await expect(page.locator("figure.attachment figcaption")).toHaveText("On the river")
    }
  })
})
