import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { NativeCapture } from "../../helpers/native_capture.js"

test.describe("native: selection-driven dispatch", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("cursor moving from plain to bold dispatches with bold.active true", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p>plain <strong>boldtext</strong></p>")
    await editor.select("plain")
    await capture.reset()

    await editor.select("boldtext")
    await editor.flush()

    expect(await capture.count()).toBeGreaterThan(0)
    expect((await capture.last()).attributes.bold.active).toBe(true)
    await capture.assertContract()
  })

  test("cursor moving into a heading reports heading.active and tag", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p>plain</p><h3>medium</h3>")
    await editor.select("plain")
    await capture.reset()

    await editor.select("medium")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes.heading.active).toBe(true)
    expect(last.headingTag).toBe("h3")
  })

  test("cursor moving into a list reports unordered-list.active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p>plain</p><ul><li>item</li></ul>")
    await editor.select("plain")
    await capture.reset()

    await editor.select("item")
    await editor.flush()

    expect((await capture.last()).attributes["unordered-list"].active).toBe(true)
  })

  test("cursor moving into a quote reports quote.active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p>plain</p><blockquote>quoted</blockquote>")
    await editor.select("plain")
    await capture.reset()

    await editor.select("quoted")
    await editor.flush()

    expect((await capture.last()).attributes.quote.active).toBe(true)
  })
})
