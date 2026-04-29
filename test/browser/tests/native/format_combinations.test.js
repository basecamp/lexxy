import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { NativeCapture } from "../../helpers/native_capture.js"

test.describe("native: format combinations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("bold + italic span reports both active in a single dispatch", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p><strong><em>both</em></strong></p>")
    await editor.select("both")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes.bold.active).toBe(true)
    expect(last.attributes.italic.active).toBe(true)
    await capture.assertContract()
  })

  test("bold + link span reports both active in a single dispatch", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p><a href='https://example.com'><strong>bold link</strong></a></p>")
    await editor.select("bold link")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes.bold.active).toBe(true)
    expect(last.link.active).toBe(true)
    expect(last.link.href).toBe("https://example.com")
  })

  test("heading + bold reports both active in a single dispatch", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<h2><strong>bold heading</strong></h2>")
    await editor.select("bold heading")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes.heading.active).toBe(true)
    expect(last.attributes.bold.active).toBe(true)
    expect(last.headingTag).toBe("h2")
  })

  test("italic + strikethrough span reports both active in a single dispatch", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p><em><s>both</s></em></p>")
    await editor.select("both")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes.italic.active).toBe(true)
    expect(last.attributes.strikethrough.active).toBe(true)
  })
})
