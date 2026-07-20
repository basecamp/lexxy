import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("@ inserted before an existing word", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-filtering.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("filters by the word that follows the trigger", async ({ page, editor }) => {
    await editor.send("Jack")
    await editor.send("Home")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveCount(2)

    const names = await items.allTextContents()
    expect(names).toEqual([ "Jack Franklin", "Clara Jackson" ])
  })

  test("ignores punctuation after the cursor when filtering", async ({ page, editor }) => {
    await editor.send("Hello .")
    await editor.send("ArrowLeft")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveCount(7)

    await editor.send("Jack")

    await expect(items).toHaveCount(2)
    const names = await items.allTextContents()
    expect(names).toEqual([ "Jack Franklin", "Clara Jackson" ])
  })

  test("ignores other punctuation such as commas after the cursor", async ({ page, editor }) => {
    await editor.send("Hello ,")
    await editor.send("ArrowLeft")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.send("Sam")

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveCount(1)

    const names = await items.allTextContents()
    expect(names).toEqual([ "Sam Smidjam" ])
  })

  test("replaces the trigger and query while keeping the punctuation after the cursor", async ({ page, editor }) => {
    await editor.send("Hello .")
    await editor.send("ArrowLeft")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.send("Jack")

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveCount(2)

    await editor.send("Enter")
    await editor.flush()

    await expect(popover).not.toBeVisible()
    const plainText = await editor.plainTextValue()
    expect(plainText).toContain("Jack Franklin")
    expect(plainText).toContain(".")
    expect(plainText).not.toContain("@")
  })

  test("keeps hyphens joining word characters in the query", async ({ page, editor }) => {
    await editor.send("Anne-Marie")
    await editor.send("Home")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveCount(1)

    const names = await items.allTextContents()
    expect(names).toEqual([ "Anne-Marie O'Connor" ])

    await editor.send("Enter")
    await editor.flush()

    const plainText = await editor.plainTextValue()
    expect(plainText).toContain("Anne-Marie O'Connor")
    expect(plainText).not.toContain("@")
  })

  test("keeps apostrophes joining word characters in the query", async ({ page, editor }) => {
    await editor.send("O'Connor")
    await editor.send("Home")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveCount(1)

    const names = await items.allTextContents()
    expect(names).toEqual([ "Anne-Marie O'Connor" ])
  })

  test("replaces the trigger and the following word with the selected mention", async ({ page, editor }) => {
    await editor.send("Jack")
    await editor.send("Home")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.send("Enter")
    await editor.flush()

    await expect(popover).not.toBeVisible()
    expect(await editor.plainTextValue()).toContain("Jack Franklin")
    expect(await editor.plainTextValue()).not.toContain("@")
  })
})
