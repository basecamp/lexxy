import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { selectAttachment } from "../../helpers/attachment_helpers.js"

test.describe("Mention accessibility", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
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

  test("restores the original avatar description when the caret leaves a mention", async ({ page, editor }) => {
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
    await page.getByRole("textbox", { name: "Post title" }).click()
    await editor.setValue('<p><action-text-attachment sgid="alice" content-type="application/vnd.test.mention" content="&lt;span&gt;&lt;img src=&quot;/example.png&quot; alt=&quot;Alice at the beach&quot;&gt;Alice&lt;/span&gt;"></action-text-attachment></p>')
    await editor.flush()
    await expect(page.getByRole("textbox", { name: "Post title" })).toBeFocused()
    await expect(editor.content.locator("action-text-attachment img")).toHaveAttribute("alt", "Alice at the beach")
  })

  test("preserves an authored aria-hidden label after leaving a mention", async ({ page, editor }) => {
    await editor.setValue('<p>Hi <action-text-attachment sgid="alice" content-type="application/vnd.test.mention" content="&lt;span&gt;&lt;img src=&quot;/example.png&quot; alt=&quot;Alice&quot;&gt;&lt;span class=&quot;mention-label&quot; aria-hidden=&quot;true&quot;&gt;Alice&lt;/span&gt;&lt;/span&gt;"></action-text-attachment> there</p>')
    await editor.flush()

    const mention = editor.content.locator("action-text-attachment")
    const label = mention.locator(".mention-label")
    await expect(label).toHaveAttribute("aria-hidden", "true")

    await selectAttachment(mention)
    await page.getByRole("textbox", { name: "Post title" }).click()

    await expect(label).toHaveAttribute("aria-hidden", "true")
  })
})
