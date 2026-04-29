import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { NativeCapture } from "../../helpers/native_capture.js"

test.describe("native: format detail correctness", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("link.href reports the URL when cursor is inside a link", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p><a href='https://example.com'>linked</a></p>")
    await editor.select("linked")

    const last = await capture.last()
    expect(last.link.active).toBe(true)
    expect(last.link.href).toBe("https://example.com")
    await capture.assertContract()
  })

  test("link.href is null when cursor is not inside a link", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p>plain text</p>")
    await editor.select("plain")

    const last = await capture.last()
    expect(last.link.active).toBe(false)
    expect(last.link.href).toBeNull()
  })

  for (const tag of [ "h2", "h3", "h4" ]) {
    test(`heading payload reports tag ${tag} matching the element`, async ({ page, editor }) => {
      const capture = new NativeCapture(page)
      await capture.install()
      await editor.setValue(`<${tag}>heading text</${tag}>`)
      await editor.select("heading")
      await editor.flush()

      const last = await capture.last()
      expect(last.attributes.heading.active).toBe(true)
      expect(last.attributes.heading.tag).toBe(tag)
      expect(last.headingTag).toBe(tag)
    })
  }

  test("highlight color populates when active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue('<p><mark style="color: rgb(255, 0, 0);">marked</mark></p>')
    await editor.select("marked")

    const last = await capture.last()
    expect(last.highlight.active).toBe(true)
    expect(last.highlight.color || last.highlight.backgroundColor).toBeTruthy()
    await capture.assertContract()
  })

  test("highlight color and backgroundColor are null when inactive", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.setValue("<p>plain</p>")
    await editor.select("plain")

    const last = await capture.last()
    expect(last.highlight.active).toBe(false)
    expect(last.highlight.color).toBeNull()
    expect(last.highlight.backgroundColor).toBeNull()
  })
})
