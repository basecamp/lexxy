import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { attachmentTag, selectAttachment } from "../../helpers/attachment_helpers.js"

test.describe("Gallery navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("ArrowRight from a selected image moves the selection to the next image", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "one.png")}${attachmentTag("b", "two.png")}</div>`)
    await editor.flush()

    const figures = page.locator(".attachment-gallery figure.attachment")
    await selectAttachment(figures.first())
    await expect(figures.first()).toHaveClass(/node--selected/)

    await editor.focus()
    await page.keyboard.press("ArrowRight")

    await expect(figures.nth(1)).toHaveClass(/node--selected/)
    await expect(figures.first()).not.toHaveClass(/node--selected/)
  })

  test("ArrowLeft from a selected image moves the selection to the previous image", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "one.png")}${attachmentTag("b", "two.png")}</div>`)
    await editor.flush()

    const figures = page.locator(".attachment-gallery figure.attachment")
    await selectAttachment(figures.nth(1))
    await expect(figures.nth(1)).toHaveClass(/node--selected/)

    await editor.focus()
    await page.keyboard.press("ArrowLeft")

    await expect(figures.first()).toHaveClass(/node--selected/)
    await expect(figures.nth(1)).not.toHaveClass(/node--selected/)
  })
})
