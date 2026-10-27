import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { NativeCapture } from "../../helpers/native_capture.js"

test.describe("native: reconnect", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("focusing a re-attached editor syncs the toolbar again", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.click()
    await editor.send("plain ")
    await page.keyboard.press("ControlOrMeta+b")
    await editor.send("bold")
    await editor.flush()

    await page.evaluate(() => {
      const element = document.querySelector("lexxy-editor")
      const placeholder = document.createComment("restoring editor")
      element.replaceWith(placeholder)
      placeholder.replaceWith(element)
    })
    await page.waitForSelector("lexxy-editor[connected]")
    await page.evaluate(() => {
      const element = document.querySelector("lexxy-editor")
      element.registerAdapter(new window.LexxyNativeAdapter(element))
      window.focusEvents = 0
      element.addEventListener("lexxy:focus", () => window.focusEvents++)
    })
    await capture.reset()

    await editor.content.click()
    await editor.flush()

    expect(await page.evaluate(() => window.focusEvents)).toBe(1)
    expect((await capture.last()).attributes.bold.active).toBe(true)
    await capture.assertContract()
  })
})
