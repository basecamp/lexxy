import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { announcements, attachmentTag, selectAttachment, watchAnnouncements } from "../../helpers/attachment_helpers.js"

test.describe("Attachment captions", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.route("**/*.png", route => route.fulfill({ path: "test/fixtures/files/example.png", contentType: "image/png" }))
    await page.goto("/attachments.html")
    await editor.waitForConnected()
  })

  test("clearing a caption restores the filename without changing the image", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "example.png", { caption: "Hello" }))
    await editor.flush()

    const figure = editor.content.locator("figure.attachment")
    await figure.locator("figcaption").click()
    const caption = page.getByRole("textbox", { name: "Image caption", exact: true })
    await caption.fill("")
    await caption.press("Escape")

    await expect(figure.locator("figcaption")).toHaveText("example.png")
    await expect(figure.locator("img")).toHaveAttribute("src", "/example.png")
    await figure.locator("figcaption").click()
    await expect(caption).toHaveValue("")
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

  test("caption editing exposes the focused field outside the editor textbox", async ({ page, editor }) => {
    await editor.setValue(`<p>Before</p>${attachmentTag("a", "canoe.png", { caption: "On the river" })}<p>After</p>`)
    await editor.flush()
    await editor.content.locator("p", { hasText: "Before" }).click()
    await selectAttachment(page.locator("figure.attachment"))
    await page.keyboard.press("Tab")

    const caption = page.getByRole("textbox", { name: "Image caption", exact: true })
    await expect(caption).toBeFocused()
    expect(await caption.evaluate(element => element.closest("[aria-hidden='true']"))).toBeNull()
    expect(await caption.evaluate(element => element.parentElement.closest("[role='textbox']"))).toBeNull()
    await expect(caption).toHaveAttribute("tabindex", "-1")

    await caption.fill("At sunset")
    await caption.press("Escape")
    await expect(editor.content).toBeFocused()
    await expect(page.locator("figure.attachment")).toHaveClass(/node--selected/)
    await expect(page.getByRole("textbox", { name: "Image caption", exact: true })).toHaveCount(0)
    await expect(page.locator(".attachment__caption-text")).toHaveText("At sunset")
    expect(await editor.value()).toContain('caption="At sunset"')
  })

  test("Shift+Tab from a caption returns to the attachment after using its toolbar", async ({ page, editor }) => {
    await editor.setValue(`<p>Before</p>${attachmentTag("a", "canoe.png")}<p>After</p>`)
    await editor.flush()

    const figure = editor.content.locator("figure.attachment")
    await selectAttachment(figure)
    await page.keyboard.press("Alt+F10")
    await expect(page.locator("lexxy-attachment-toolbar button").first()).toBeFocused()
    await page.keyboard.press("Home")
    await page.keyboard.press("Escape")
    await expect(editor.content).toBeFocused()
    await page.keyboard.press("Tab")

    const caption = page.getByRole("textbox", { name: "Image caption", exact: true })
    await expect(caption).toBeFocused()
    await caption.fill("At sunset")
    await page.keyboard.press("Shift+Tab")
    await expect(editor.content).toBeFocused()
    await expect(figure).toHaveClass(/node--selected/)
    await expect(caption).toHaveCount(0)
    expect(await editor.value()).toContain('caption="At sunset"')
    await page.keyboard.press("Tab")
    await expect(caption).toBeFocused()
  })

  test("caption editing follows a gallery reflow and preserves each image's caption", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "canoe.png", { caption: "First" })}${attachmentTag("b", "trees.png", { caption: "Second" })}</div><p>After</p>`)
    await editor.flush()

    const captions = page.locator("figure.attachment figcaption")
    const input = page.getByRole("textbox", { name: "Image caption", exact: true })
    await captions.first().click()
    await expect(input).toHaveValue("First")
    await input.fill("A long caption that wraps onto more than one line in a narrow gallery")
    await page.setViewportSize({ width: 400, height: 600 })
    await expect.poll(async () => {
      const field = await input.boundingBox()
      const caption = await captions.first().boundingBox()
      return Math.max(Math.abs(field.x - caption.x), Math.abs(field.y - caption.y), Math.abs(field.width - caption.width), Math.abs(field.height - caption.height))
    }).toBeLessThan(2)
    await expect(input).toBeFocused()
    await captions.nth(1).click()
    await expect(input).toHaveValue("Second")
    await input.fill("Another view")
    await input.press("Enter")
    await page.keyboard.type("Some text")
    await expect(editor.content.locator("p").last()).toContainText("Some text")
    expect(await editor.value()).toContain('caption="Another view"')
    expect(await editor.value()).toContain('caption="A long caption that wraps onto more than one line in a narrow gallery"')
  })

  test("caption editing closes when its attachment is replaced", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "canoe.png", { caption: "On the river" }))
    await editor.flush()

    const input = page.getByRole("textbox", { name: "Image caption", exact: true })
    await expect(input).toHaveCount(0)
    await page.locator("figure.attachment figcaption").click()
    await input.fill("At sunset")
    await editor.setValue("<p>Replacement</p>")
    await expect(input).toHaveCount(0)
    await expect(editor.content).toHaveText("Replacement")
  })
})
