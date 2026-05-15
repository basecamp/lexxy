import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { attachmentTag, selectAttachment } from "../../helpers/attachment_helpers.js"

test.describe("Attachment fake selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("parks the DOM range on a hidden span carrying the figure label", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "one.png")}${attachmentTag("b", "two.png")}</div>`)
    await editor.flush()

    const firstFigure = page.locator(".attachment-gallery figure.attachment").first()
    await selectAttachment(firstFigure)

    await expect(firstFigure.locator(".lexxy-fake-selection")).toBeAttached()
    await expect(firstFigure.locator(".lexxy-fake-selection")).toHaveText("one.png")
  })
})
