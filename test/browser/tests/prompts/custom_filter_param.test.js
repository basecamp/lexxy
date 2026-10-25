import { test } from "../../test_helper.js"
import { EditorHandle } from "../../helpers/editor_handle.js"
import { expect } from "@playwright/test"

test.describe("Remote filtering parameter name", () => {
  let searchParams

  test.beforeEach(async ({ page }) => {
    searchParams = new URLSearchParams()

    await page.route("**/prompt-items**", async (route) => {
      searchParams = new URL(route.request().url()).searchParams
      await route.fulfill({ contentType: "text/html", body: "" })
    })

    await page.goto("/prompt-filter-param.html")
  })

  test("defaults to filter when the attribute is omitted", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='default'] lexxy-editor")
    await editor.waitForConnected()

    await editor.send("@")
    await expect(editor.locator.locator(".lexxy-prompt-menu--visible")).toBeVisible()
    await editor.send("sutko")

    await expect.poll(() => searchParams.get("filter")).toBe("sutko")
  })

  test("uses a custom parameter and preserves existing query parameters", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='custom'] lexxy-editor")
    await editor.waitForConnected()

    await editor.send("@")
    await expect(editor.locator.locator(".lexxy-prompt-menu--visible")).toBeVisible()
    await editor.send("sutko")

    await expect.poll(() => searchParams.get("query")).toBe("sutko")
    expect(searchParams.has("filter")).toBe(false)
    expect(searchParams.get("scope")).toBe("team")
  })

  test("defaults to filter when the attribute is empty", async ({ page }) => {
    const editor = new EditorHandle(page, "[data-editor='empty'] lexxy-editor")
    await editor.waitForConnected()

    await editor.send("@")
    await expect(editor.locator.locator(".lexxy-prompt-menu--visible")).toBeVisible()
    await editor.send("sutko")

    await expect.poll(() => searchParams.get("filter")).toBe("sutko")
  })
})
