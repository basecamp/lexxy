import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { attachmentTag, selectAttachment } from "../../helpers/attachment_helpers.js"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Editing attachment alternative text", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.route("**/*.png", route => route.fulfill({ path: "test/fixtures/files/example.png", contentType: "image/png" }))
    await page.goto("/attachments.html")
    await editor.waitForConnected()
  })

  test("adds, edits and removes a description independently of the caption", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "canoe.png", { caption: "On the river" }))
    await editor.flush()
    const figure = page.locator("figure.attachment")

    for (const description of [ "A red canoe beside green trees", 'A blue canoe near a sign reading "River & lake"', "" ]) {
      await editor.focus()
      await selectAttachment(figure)
      await page.getByRole("button", { name: "Alternative text", exact: true }).click()
      const dialog = page.getByRole("dialog", { name: "Alternative text" })
      await dialog.getByRole("textbox", { name: "Description" }).fill(description)
      await dialog.getByRole("button", { name: "Save", exact: true }).click()

      await expect(dialog).toBeHidden()
      await expect(figure.locator("img")).toHaveAttribute("alt", description)
      await expect(figure.locator(".attachment__caption-text")).toHaveText("On the river")
      await figure.locator("figcaption").click()
      const caption = page.getByRole("textbox", { name: "Image caption", exact: true })
      await expect(caption).toHaveValue("On the river")
      await caption.press("Escape")
      const value = await editor.value()
      await editor.setValue(value)
      await editor.flush()
      await editor.focus()
      await selectAttachment(figure)
      await page.getByRole("button", { name: "Alternative text", exact: true }).click()
      await expect(dialog.getByRole("textbox", { name: "Description" })).toHaveValue(description)
      await dialog.getByRole("button", { name: "Cancel" }).click()
    }
  })

  test("keyboard authoring, cancellation, undo and redo preserve the attachment", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "canoe.png", { alt: "A red canoe" }))
    await editor.flush()
    const figure = page.locator("figure.attachment")
    await editor.focus()
    await selectAttachment(figure)
    await editor.focus()
    await page.keyboard.press("Alt+F10")
    await expect(page.locator("lexxy-attachment-toolbar").getByRole("button", { name: "Remove", exact: true })).toBeFocused()
    await page.keyboard.press("ArrowRight")
    const button = page.getByRole("button", { name: "Alternative text", exact: true })
    await expect(button).toBeFocused()
    await page.keyboard.press("Enter")

    const dialog = page.getByRole("dialog", { name: "Alternative text" })
    const input = dialog.getByRole("textbox", { name: "Description" })
    await expect(input).toBeFocused()
    await input.fill("Discard this description")
    await input.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(button).toBeFocused()
    await expect(figure.locator("img")).toHaveAttribute("alt", "A red canoe")

    await button.press("Enter")
    await expect(input).toHaveValue("A red canoe")
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

  test("new uploads do not use the filename as a description", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")
    await expect(page.locator("figure.attachment img")).toHaveAttribute("alt", "")
    expect(await editor.value()).not.toContain('alt="example.png"')
  })

  test("imported image descriptions do not become captions", async ({ page, editor }) => {
    await editor.setValue('<img src="/canoe.png" alt="A red canoe" width="50" height="50">')
    await editor.flush()
    await expect(page.locator("figure.attachment img")).toHaveAttribute("alt", "A red canoe")
    await expect(page.locator(".attachment__caption-text")).toHaveText("canoe.png")
    await page.locator("figure.attachment figcaption").click()
    await expect(page.getByRole("textbox", { name: "Image caption", exact: true })).toHaveValue("")
    expect(await editor.value()).toContain('alt="A red canoe"')
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
})
