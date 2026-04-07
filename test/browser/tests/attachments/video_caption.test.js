import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const videoAttachment = (attrs = {}) => {
  const defaults = {
    sgid: "test-sgid-video-1",
    "content-type": "video/mp4",
    filename: "sample.mp4",
    filesize: "524288",
    url: "http://example.com/sample.mp4",
  }
  const merged = { ...defaults, ...attrs }
  const attrString = Object.entries(merged).map(([k, v]) => `${k}="${v}"`).join(" ")
  return `<action-text-attachment ${attrString}></action-text-attachment>`
}

test.describe("Video attachment caption", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("video attachment has an editable caption", async ({ page, editor }) => {
    await editor.setValue(videoAttachment())
    await editor.flush()

    const figure = page.locator("figure.attachment[data-content-type='video/mp4']")
    await expect(figure).toBeVisible()

    const captionTextarea = figure.locator("figcaption textarea")
    await expect(captionTextarea).toBeVisible()
    await expect(captionTextarea).toHaveAttribute("placeholder", "sample.mp4")
  })

  test("video caption can be edited and syncs to editor value", async ({ page, editor }) => {
    await editor.setValue(videoAttachment())
    await editor.flush()

    const figure = page.locator("figure.attachment[data-content-type='video/mp4']")
    await expect(figure).toBeVisible()

    const caption = figure.locator("figcaption textarea")
    await expect(caption).toBeVisible()

    await caption.click()
    await caption.pressSequentially("My video caption")
    await caption.press("Enter")

    await expect.poll(async () => {
      await editor.flush()
      return await editor.value()
    }, { timeout: 5_000 }).toContain('caption="My video caption"')
  })
})
