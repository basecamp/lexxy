import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Reconnect", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("editor disposes cleanly on disconnect", async ({ page, editor }) => {
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.focus()
    await editor.send("Hello")

    await page.evaluate(() => {
      const el = document.querySelector("lexxy-editor")
      const parent = el.parentElement
      parent.removeChild(el)
      parent.appendChild(el)
    })

    await editor.waitForConnected()
    expect(errors).toEqual([])
  })

  test("reconnect does not duplicate child elements", async ({ page, editor }) => {
    await editor.focus()
    await editor.send("Hello")

    await page.evaluate(() => {
      const el = document.querySelector("lexxy-editor")
      const parent = el.parentElement
      parent.removeChild(el)
      parent.appendChild(el)
    })

    await editor.waitForConnected()

    const editorEl = page.locator("lexxy-editor")
    await expect(editorEl.locator("lexxy-toolbar")).toHaveCount(1)
    await expect(editorEl.locator("lexxy-table-tools")).toHaveCount(1)
    await expect(editorEl.locator("lexxy-code-language-picker")).toHaveCount(1)
  })

  test("editor recovers when turbo:before-cache fires without a body replacement", async ({ page, editor }) => {
    await editor.focus()
    await editor.send("Hello")

    await page.evaluate(() => {
      document.dispatchEvent(new Event("turbo:before-cache"))
      document.dispatchEvent(new Event("turbo:load"))
    })

    await editor.waitForConnected()
    await expect(page.locator("lexxy-editor .lexxy-editor__content")).toBeVisible()

    await editor.focus()
    await editor.send(" world")

    const text = await editor.plainTextValue()
    expect(text).toContain("Hello")
    expect(text).toContain(" world")
  })
})

test.describe("Reconnect with extension toolbar buttons", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/extension-toolbar-button.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("extension toolbar button is not duplicated after reconnect", async ({ page, editor }) => {
    await expect(page.locator("lexxy-toolbar button[name='custom-extension-button']")).toHaveCount(1)

    await page.evaluate(() => {
      const el = document.querySelector("lexxy-editor")
      const parent = el.parentElement
      parent.removeChild(el)
      parent.appendChild(el)
    })

    await editor.waitForConnected()

    await expect(page.locator("lexxy-toolbar button[name='custom-extension-button']")).toHaveCount(1)
  })
})
