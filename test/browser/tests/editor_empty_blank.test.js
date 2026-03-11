import { test } from "../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Editor empty and blank", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/new")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("an empty editor is both blank and empty", async ({ editor }) => {
    expect(await editor.isEmpty()).toBe(true)
    expect(await editor.isBlank()).toBe(true)
  })

  test("text is neither empty nor blank", async ({ editor }) => {
    await editor.send("Hello")

    expect(await editor.isEmpty()).toBe(false)
    expect(await editor.isBlank()).toBe(false)
  })

  test("an editor returns to empty and blank state after content is removed", async ({
    editor,
  }) => {
    await editor.send("Hello")
    await editor.selectAll()
    await editor.send("Backspace")

    await expect
      .poll(async () => await editor.isEmpty(), { timeout: 5_000 })
      .toBe(true)
    expect(await editor.isBlank()).toBe(true)
  })

  test("an editor with white space is blank but not empty", async ({
    editor,
  }) => {
    await editor.send("   ")
    await editor.sendTab()
    await editor.send("Enter")

    await editor.flush()
    expect(await editor.isEmpty()).toBe(false)
    expect(await editor.isBlank()).toBe(true)
  })
})
