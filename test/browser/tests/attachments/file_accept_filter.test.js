import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Internal lexxy:file-accept listener honors data-permitted-attachment-types", () => {
  test("disallowed file MIME is rejected by the internal lexxy:file-accept listener", async ({ page }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")

    const prevented = await page.evaluate(() => {
      const editor = document.querySelector("lexxy-editor")
      const file = new File([ "" ], "photo.png", { type: "image/png" })
      const event = new CustomEvent("lexxy:file-accept", { detail: { file }, cancelable: true, bubbles: true })
      editor.dispatchEvent(event)
      return event.defaultPrevented
    })

    expect(prevented).toBe(true)
  })

  test("permitted file MIME is not rejected by the internal lexxy:file-accept listener", async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")

    const prevented = await page.evaluate(() => {
      const editor = document.querySelector("lexxy-editor")
      const file = new File([ "" ], "photo.png", { type: "image/png" })
      const event = new CustomEvent("lexxy:file-accept", { detail: { file }, cancelable: true, bubbles: true })
      editor.dispatchEvent(event)
      return event.defaultPrevented
    })

    expect(prevented).toBe(false)
  })

  test("file MIME matching an explicit allowlist entry is not rejected", async ({ page }) => {
    await page.goto("/attachments-permitted-image-png.html")
    await page.waitForSelector("lexxy-editor[connected]")

    const prevented = await page.evaluate(() => {
      const editor = document.querySelector("lexxy-editor")
      const file = new File([ "" ], "photo.png", { type: "image/png" })
      const event = new CustomEvent("lexxy:file-accept", { detail: { file }, cancelable: true, bubbles: true })
      editor.dispatchEvent(event)
      return event.defaultPrevented
    })

    expect(prevented).toBe(false)
  })
})
