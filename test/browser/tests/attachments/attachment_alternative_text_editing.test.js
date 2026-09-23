import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { attachmentTag, selectAttachment } from "../../helpers/attachment_helpers.js"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Attachment alternative text editing", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.route("**/*.png", route => route.fulfill({ path: "test/fixtures/files/example.png", contentType: "image/png" }))
    await page.goto("/attachments.html")
    await editor.waitForConnected()
  })

  test("adds and edits a description independently of the caption", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "canoe.png", { caption: "On the river" }))
    await editor.flush()
    const figure = page.locator("figure.attachment")

    for (const description of [ "A red canoe beside green trees", 'A blue canoe near a sign reading "River & lake"' ]) {
      await editor.focus()
      await selectAttachment(figure)
      await page.getByRole("button", { name: "Alternative text", exact: true }).click()
      const dialog = page.getByRole("dialog", { name: "Alternative text" })
      await dialog.getByRole("textbox", { name: "Description" }).fill(description)
      await dialog.getByRole("button", { name: "Save", exact: true }).click()

      await expect(dialog).toBeHidden()
      await expect(figure.locator("img")).toHaveAttribute("alt", description)
      await expect(figure.locator(".attachment__caption-text")).toHaveText("On the river")
    }
  })

  test("removing a description preserves the caption", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "canoe.png", { caption: "On the river", alt: "A red canoe" }))
    await editor.flush()
    await editor.focus()
    const figure = page.locator("figure.attachment")
    await selectAttachment(figure)
    await page.getByRole("button", { name: "Alternative text", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Alternative text" })
    await dialog.getByRole("textbox", { name: "Description" }).fill("")
    await dialog.getByRole("button", { name: "Save", exact: true }).click()

    await expect(figure.locator("img")).toHaveAttribute("alt", "")
    await expect(figure.locator(".attachment__caption-text")).toHaveText("On the river")
    expect(await editor.value()).not.toContain('alt="A red canoe"')
  })

  for (const action of [ "Cancel", "Escape" ]) {
    test(`${action} discards a draft description and returns focus`, async ({ page, editor }) => {
      await editor.setValue(attachmentTag("a", "canoe.png", { alt: "A red canoe" }))
      await editor.flush()
      await editor.focus()
      const figure = page.locator("figure.attachment")
      await selectAttachment(figure)
      const button = page.getByRole("button", { name: "Alternative text", exact: true })
      await button.focus()
      await button.press("Enter")
      const dialog = page.getByRole("dialog", { name: "Alternative text" })
      const input = dialog.getByRole("textbox", { name: "Description" })
      await input.fill("Discard this description")
      if (action === "Escape") {
        await input.press("Escape")
      } else {
        await dialog.getByRole("button", { name: "Cancel" }).click()
      }

      await expect(dialog).toBeHidden()
      await expect(button).toBeFocused()
      await expect(figure.locator("img")).toHaveAttribute("alt", "A red canoe")
      await button.press("Enter")
      await expect(input).toHaveValue("A red canoe")
    })
  }

  test("opens below its attachment instead of as a page-level modal", async ({ page, editor }) => {
    await editor.setValue(`<p>Above</p>${attachmentTag("a", "canoe.png")}`)
    await editor.flush()
    await editor.focus()
    const figure = page.locator("figure.attachment")
    await selectAttachment(figure)
    await page.getByRole("button", { name: "Alternative text", exact: true }).click()

    const dialog = page.getByRole("dialog", { name: "Alternative text" })
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate(element => element.matches(":modal"))).toBe(false)

    const dialogBox = await dialog.boundingBox()
    const figureBox = await figure.boundingBox()
    const editorBox = await editor.locator.boundingBox()
    expect(dialogBox.y).toBeGreaterThanOrEqual(figureBox.y + figureBox.height)
    expect(dialogBox.x).toBeGreaterThanOrEqual(editorBox.x)
    expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(editorBox.x + editorBox.width)
    expect(dialogBox.width / editorBox.width).toBeCloseTo(0.6, 1)
  })

  test("opening it closes an open toolbar dropdown", async ({ page, editor }) => {
    await editor.setValue(`<p>Above</p>${attachmentTag("a", "canoe.png")}`)
    await editor.flush()
    await editor.focus()
    await selectAttachment(page.locator("figure.attachment"))

    await page.locator("lexxy-toolbar button[name='link']").click()
    const linkPanel = page.locator("lexxy-link-dropdown [data-dropdown-panel]")
    await expect(linkPanel).toBeVisible()

    await page.getByRole("button", { name: "Alternative text", exact: true }).click()

    await expect(page.getByRole("dialog", { name: "Alternative text" })).toBeVisible()
    await expect(linkPanel).toBeHidden()
  })

  test("clicking outside discards the draft and leaves focus where it landed", async ({ page, editor }) => {
    await editor.setValue(`<p>Above</p>${attachmentTag("a", "canoe.png", { alt: "A red canoe" })}`)
    await editor.flush()
    await editor.focus()
    const figure = page.locator("figure.attachment")
    await selectAttachment(figure)
    await page.getByRole("button", { name: "Alternative text", exact: true }).click()

    const dialog = page.getByRole("dialog", { name: "Alternative text" })
    await dialog.getByRole("textbox", { name: "Description" }).fill("Discard this description")
    // The panel sits below the attachment, so dismiss by clicking above it.
    await editor.content.locator("p", { hasText: "Above" }).click()

    await expect(dialog).toBeHidden()
    await expect(editor.content).toBeFocused()
    await expect(figure.locator("img")).toHaveAttribute("alt", "A red canoe")
  })

  test("keyboard authoring, undo and redo preserve the attachment", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "canoe.png", { alt: "A red canoe" }))
    await editor.flush()
    const figure = page.locator("figure.attachment")
    await editor.focus()
    await selectAttachment(figure)
    await editor.focus()
    await page.keyboard.press("Alt+F10")
    const button = page.getByRole("button", { name: "Alternative text", exact: true })
    await expect(button).toBeFocused()
    await page.keyboard.press("Enter")

    const dialog = page.getByRole("dialog", { name: "Alternative text" })
    const input = dialog.getByRole("textbox", { name: "Description" })
    await expect(input).toBeFocused()
    await input.fill("A blue canoe")
    await input.press("Tab")
    await page.keyboard.press("Tab")
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(button).toBeFocused()
    await button.press("Escape")
    await expect(editor.content).toBeFocused()
    await expect(figure).toHaveClass(/node--selected/)
    await page.keyboard.press("ControlOrMeta+z")
    await expect(figure.locator("img")).toHaveAttribute("alt", "A red canoe")
    await page.keyboard.press("ControlOrMeta+Shift+z")
    await expect(figure.locator("img")).toHaveAttribute("alt", "A blue canoe")
    await expect(figure.locator(".attachment__caption-text")).toHaveText("canoe.png")

    await page.keyboard.press("Tab")
    await expect(page.getByRole("textbox", { name: "Image caption", exact: true })).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(editor.content).toBeFocused()
    await expect(figure).toHaveClass(/node--selected/)
  })

  test("editing a gallery image leaves the other descriptions alone", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "whale.png", { alt: "A whale" })}${attachmentTag("b", "canoe.png", { alt: "A canoe" })}</div>`)
    await editor.flush()
    await editor.focus()
    await selectAttachment(page.locator("figure.attachment").nth(1))
    await page.getByRole("button", { name: "Alternative text", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Alternative text" })
    await dialog.getByRole("textbox", { name: "Description" }).fill("Two people paddling a canoe")
    await dialog.getByRole("button", { name: "Save", exact: true }).click()
    await expect(page.locator("figure.attachment img").nth(0)).toHaveAttribute("alt", "A whale")
    await expect(page.locator("figure.attachment img").nth(1)).toHaveAttribute("alt", "Two people paddling a canoe")
  })

  test("a delayed preview uses the description authored while it was loading", async ({ page, editor }) => {
    const uploads = await mockActiveStorageUploads(page, { delayBlobResponses: true })
    await editor.uploadFile("test/fixtures/files/dummy.pdf")
    const figure = page.locator("figure.attachment")
    await expect(figure).toHaveClass(/attachment--file/)
    await editor.focus()
    await selectAttachment(figure)
    await page.getByRole("button", { name: "Alternative text", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Alternative text" })
    await dialog.getByRole("textbox", { name: "Description" }).fill("A chart of monthly rainfall")
    await dialog.getByRole("button", { name: "Save", exact: true }).click()
    await uploads.releaseBlobResponses()
    await expect(figure.locator("img")).toHaveAttribute("alt", "A chart of monthly rainfall")
    expect(await editor.value()).toContain('alt="A chart of monthly rainfall"')
  })

  test("files without image previews do not offer alternative text", async ({ page, editor }) => {
    await editor.setValue('<action-text-attachment sgid="a" content-type="text/plain" filename="note.txt"></action-text-attachment>')
    await editor.flush()
    await editor.focus()
    await selectAttachment(page.locator("figure.attachment"))
    await expect(page.getByRole("button", { name: "Remove", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Alternative text", exact: true })).toBeHidden()
  })

  test("older Action Text hides authoring without removing existing descriptions", async ({ page, editor }) => {
    await editor.locator.evaluate(element => {
      element.dataset.actionTextSupportsAlt = "false"
    })
    await editor.setValue(attachmentTag("a", "canoe.png", { alt: "A red canoe" }))
    await editor.flush()
    await editor.focus()
    await selectAttachment(page.locator("figure.attachment"))

    await expect(page.getByRole("button", { name: "Remove", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Alternative text", exact: true })).toBeHidden()
    await expect(page.locator("figure.attachment img")).toHaveAttribute("alt", "A red canoe")
    expect(await editor.value()).toContain('alt="A red canoe"')
  })
})
