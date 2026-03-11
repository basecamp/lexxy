import { test } from "../test_helper.js"
import { expect } from "@playwright/test"

const EMPTY_SELECTOR = "lexxy-editor.lexxy-editor--empty"

test.describe("Empty status", () => {
  test("add empty class on load when it's empty", async ({ page, editor }) => {
    await page.goto("/posts/new")
    await editor.waitForConnected()

    await expect(page.locator(EMPTY_SELECTOR)).toBeVisible()

    await editor.setValue("<p><br></p>")
    await expect(page.locator(EMPTY_SELECTOR)).toBeVisible()
  })

  test("don't add empty class on load if not empty", async ({
    page,
    editor,
  }) => {
    await page.goto("/posts/new")
    await editor.waitForConnected()
    await editor.setValue("<p>Hello everyone</p>")

    await expect(page.locator(EMPTY_SELECTOR)).toHaveCount(0)
  })

  test("update empty class dynamically as you type", async ({
    page,
    editor,
  }) => {
    await page.goto("/posts/new")
    await editor.waitForConnected()

    await expect(page.locator(EMPTY_SELECTOR)).toBeVisible()

    await editor.send("Hey there")
    await expect(page.locator(EMPTY_SELECTOR)).toHaveCount(0)

    await editor.select("Hey there")
    await editor.send("Backspace")
    await expect(page.locator(EMPTY_SELECTOR)).toBeVisible()
  })
})
