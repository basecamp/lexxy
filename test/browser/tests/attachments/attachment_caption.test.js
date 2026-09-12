import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"
import { attachmentTag, selectAttachment } from "../../helpers/attachment_helpers.js"

test.describe("Attachment caption", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("Escape from caption restores attachment selection and editor focus", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = page.locator("figure.attachment figcaption textarea")
    await expect(caption).toBeVisible({ timeout: 10_000 })

    await caption.click()
    await caption.pressSequentially("Hello")
    await caption.press("Escape")

    await expect(page.locator("figure.attachment.node--selected")).toHaveCount(1)
    await expect(editor.content).toBeFocused()
  })

  test("Tab from a selected attachment focuses the caption textarea", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await selectAttachment(figure)
    await editor.focus()
    await page.keyboard.press("Tab")

    await expect(figure.locator("figcaption textarea")).toBeFocused()
  })

  test("clearing the caption in the model syncs the textarea", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("abc", "example.png", { caption: "Hello" }))
    await editor.flush()

    const caption = page.locator("figure.attachment figcaption textarea")
    await expect(caption).toHaveValue("Hello")

    await editor.locator.evaluate((el) => {
      return new Promise((resolve) => {
        el.editor.update(() => {
          for (const [ , node ] of el.editor.getEditorState()._nodeMap) {
            if (node.__type === "action_text_attachment") node.getWritable().caption = ""
          }
        }, { onUpdate: resolve })
      })
    })
    await editor.flush()

    await expect(caption).toHaveValue("")
  })

  test("preserves the caption text node when its label is unchanged", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("abc", "example.png", { caption: "Hello" }))
    await editor.flush()

    const captionText = page.locator("figure.attachment .attachment__caption-text")
    await captionText.evaluate((element) => element.__lexxyTextNode = element.firstChild)

    await editor.locator.evaluate((element) => {
      return new Promise((resolve) => {
        element.editor.update(() => {
          for (const [ , node ] of element.editor.getEditorState()._nodeMap) {
            if (node.__type === "action_text_attachment") node.getWritable().width = 51
          }
        }, { onUpdate: resolve })
      })
    })

    await expect.poll(() => captionText.evaluate((element) => element.firstChild === element.__lexxyTextNode)).toBe(true)
  })

  test("announces the caption once when moving left from a selected gallery image", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "whale.png", { caption: "Whale" })}${attachmentTag("b", "rabbit.png", { caption: "Rabbit" })}</div>`)
    await editor.flush()

    const figure = page.locator("figure.attachment").nth(1)
    await selectAttachment(figure)
    await editor.focus()
    await page.evaluate(() => {
      window.__lexxyAriaNotifications = []
      document.ariaNotify = (message, options) => window.__lexxyAriaNotifications.push({ message, options })
    })

    await page.keyboard.press("ArrowLeft")
    await editor.flush()

    expect(await page.evaluate(() => window.__lexxyAriaNotifications)).toEqual([
      { message: "Rabbit", options: { priority: "high" } }
    ])
  })

  test("readies an inline attachment's label when the caret approaches from either side", async ({ page, editor }) => {
    await editor.setValue(
      '<p>Hi <action-text-attachment sgid="alice" content-type="application/vnd.test.mention" content="&lt;span&gt;&lt;img src=&quot;/example.png&quot;&gt;Alice&lt;/span&gt;"></action-text-attachment> there</p>'
    )
    await editor.flush()

    const avatar = editor.content.locator("action-text-attachment[content-type='application/vnd.test.mention'] img")
    await expect(avatar).toHaveAttribute("alt", "")

    // Home and End behave differently across browsers on a Mac, so place the caret by
    // clicking just inside the paragraph's edges instead.
    const paragraph = editor.content.locator("p")
    const paragraphBox = await paragraph.boundingBox()
    const clickAtEnd = () => paragraph.click({ position: { x: paragraphBox.width - 2, y: paragraphBox.height / 2 } })
    const clickAtStart = () => paragraph.click({ position: { x: 2, y: paragraphBox.height / 2 } })
    const step = async (key) => {
      await page.keyboard.press(key)
      await editor.flush()
    }

    await clickAtEnd()
    await editor.flush()
    await expect(avatar).toHaveAttribute("alt", "")

    for (let i = 0; i < " there".length - 1; i++) await step("ArrowLeft")
    await expect(avatar).toHaveAttribute("alt", "Alice")

    await clickAtEnd()
    await editor.flush()
    await expect(avatar).toHaveAttribute("alt", "")

    await clickAtStart()
    await step("ArrowRight")
    await expect(avatar).toHaveAttribute("alt", "")
    await step("ArrowRight")
    await expect(avatar).toHaveAttribute("alt", "Alice")
  })
})
