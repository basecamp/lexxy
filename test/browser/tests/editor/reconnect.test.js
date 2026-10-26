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

test.describe("Reconnect with extension dispose lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/extension-dispose.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("extension dispose() removes toolbar listeners across reconnect", async ({ page, editor }) => {
    const ping = () => page.evaluate(() => {
      document.querySelector("lexxy-toolbar").dispatchEvent(new CustomEvent("lexxy-test-ping"))
    })
    const pingCount = () => page.evaluate(() => window.__lexxyDisposeTest_pingCount || 0)
    const disposeCount = () => page.evaluate(() => window.__lexxyDisposeTest_disposeCount || 0)

    await ping()
    expect(await pingCount()).toBe(1)

    await page.evaluate(() => {
      const el = document.querySelector("lexxy-editor")
      const parent = el.parentElement
      parent.removeChild(el)
      parent.appendChild(el)
    })

    await editor.waitForConnected()

    expect(await disposeCount()).toBe(1)

    await ping()
    expect(await pingCount()).toBe(2)
  })
})
