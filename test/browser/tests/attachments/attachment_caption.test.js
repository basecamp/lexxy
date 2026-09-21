import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"
import { announcements, attachmentTag, selectAttachment, watchAnnouncements } from "../../helpers/attachment_helpers.js"

test.describe("Attachment caption", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("Escape from caption restores attachment selection and editor focus", async ({ page, editor }) => {
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = page.getByRole("textbox", { name: "Image caption", exact: true })
    await page.locator("figure.attachment .attachment__caption--editable").click()
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
    await expect(figure.locator(".attachment__caption--editable")).toBeVisible({ timeout: 10_000 })

    await selectAttachment(figure)
    await editor.focus()
    await page.keyboard.press("Tab")

    await expect(page.getByRole("textbox", { name: "Image caption", exact: true })).toBeFocused()
  })

  test("clearing the caption in the model updates the displayed text", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("abc", "example.png", { caption: "Hello" }))
    await editor.flush()

    const caption = page.locator("figure.attachment figcaption")
    await expect(caption).toHaveText("Hello")

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

    await expect(caption).toHaveText("example.png")
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

  test("keeps gallery captions exposed without announcing them on cursor movement", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "whale.png", { caption: "Whale" })}${attachmentTag("b", "rabbit.png", { caption: "Rabbit" })}</div>`)
    await editor.flush()
    await watchAnnouncements(page)

    const figure = page.locator("figure.attachment").nth(1)
    await selectAttachment(figure)
    await editor.focus()
    await expect(figure).toHaveClass(/node--selected/)
    await expect(figure.locator(".attachment__caption-text")).not.toHaveAttribute("aria-hidden", "true")

    await page.keyboard.press("ArrowLeft")
    await editor.flush()

    await expect(figure).not.toHaveClass(/node--selected/)
    await expect(figure.locator(".attachment__caption-text")).not.toHaveAttribute("aria-hidden", "true")
    expect(await announcements(page)).toEqual([])
  })

  test("readies an inline attachment's label when the caret approaches from either side", async ({ page, editor }) => {
    await editor.setValue(
      '<p>Hi <action-text-attachment sgid="alice" content-type="application/vnd.test.mention" content="&lt;span&gt;&lt;img src=&quot;/example.png&quot;&gt;Alice&lt;/span&gt;"></action-text-attachment> there</p>'
    )
    await editor.flush()

    const avatar = editor.content.locator("action-text-attachment[content-type='application/vnd.test.mention'] img")
    await expect(avatar).toHaveAttribute("alt", "")

    // Home and End behave differently across browsers on a Mac.
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

  test("exposes the caption's name when it takes focus", async ({ page, editor }) => {
    await editor.setValue(`<p>Above</p>${attachmentTag("a", "one.png")}`)
    await editor.flush()

    const figure = page.locator("figure.attachment").first()
    await expect(figure).toBeVisible()
    await selectAttachment(figure)
    await editor.focus()
    await page.keyboard.press("Tab")

    await expect(page.getByRole("textbox", { name: "Image caption", exact: true })).toBeFocused()
    await expect(page.getByRole("textbox", { name: "Image caption", exact: true })).toHaveAccessibleName("Image caption")
  })
})

test("restores an authored avatar description after announcing a mention", async ({ page, editor }) => {
  await page.goto("/attachments.html")
  await editor.waitForConnected()
  await editor.setValue('<p>Hi <action-text-attachment sgid="alice" content-type="application/vnd.test.mention" content="&lt;span&gt;&lt;img src=&quot;/example.png&quot; alt=&quot;Alice at the beach&quot;&gt;Alice&lt;/span&gt;"></action-text-attachment> there</p>')
  await editor.flush()
  const mention = editor.content.locator("action-text-attachment")
  const avatar = mention.locator("img")
  const label = mention.locator("span").first()
  await expect(avatar).toHaveAttribute("alt", "Alice at the beach")
  await expect(label).not.toHaveAttribute("aria-hidden", "true")
  await selectAttachment(mention)
  await expect(avatar).toHaveAttribute("alt", "Alice")
  await expect(label).toHaveAttribute("aria-hidden", "true")
  await editor.content.locator("p").click({ position: { x: 1, y: 5 } })
  await expect(avatar).toHaveAttribute("alt", "Alice at the beach")
  await expect(label).not.toHaveAttribute("aria-hidden", "true")
})

test("does not replace an avatar's description while the editor is unfocused", async ({ page, editor }) => {
  await page.goto("/attachments.html")
  await editor.waitForConnected()
  await page.getByRole("textbox", { name: "Post title" }).click()
  await editor.setValue('<p><action-text-attachment sgid="alice" content-type="application/vnd.test.mention" content="&lt;span&gt;&lt;img src=&quot;/example.png&quot; alt=&quot;Alice at the beach&quot;&gt;Alice&lt;/span&gt;"></action-text-attachment></p>')
  await editor.flush()
  await expect(page.getByRole("textbox", { name: "Post title" })).toBeFocused()
  await expect(editor.content.locator("action-text-attachment img")).toHaveAttribute("alt", "Alice at the beach")
})

test("preserves an authored aria-hidden label after announcing a mention", async ({ page, editor }) => {
  await page.goto("/attachments.html")
  await editor.waitForConnected()
  await editor.setValue('<p>Hi <action-text-attachment sgid="alice" content-type="application/vnd.test.mention" content="&lt;span&gt;&lt;img src=&quot;/example.png&quot; alt=&quot;Alice&quot;&gt;&lt;span class=&quot;mention-label&quot; aria-hidden=&quot;true&quot;&gt;Alice&lt;/span&gt;&lt;/span&gt;"></action-text-attachment> there</p>')
  await editor.flush()
  const mention = editor.content.locator("action-text-attachment")
  const label = mention.locator(".mention-label")
  await expect(label).toHaveAttribute("aria-hidden", "true")

  await selectAttachment(mention)
  await page.getByRole("textbox", { name: "Post title" }).click()

  await expect(label).toHaveAttribute("aria-hidden", "true")
})
