import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

async function insertMention(page, editor) {
  await editor.send("@")
  await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })
  await editor.send("Enter")
  await editor.flush()
  await expect(editor.content.locator("action-text-attachment")).toBeVisible({ timeout: 5_000 })
}

async function clickAt(page, editor, clientX, clientY) {
  await page.mouse.click(clientX, clientY)
  await editor.flush()
}

test.describe("Typing beside a mention", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("clicking before a leading mention places the caret before it", async ({ page, editor }) => {
    await insertMention(page, editor)

    const mention = await editor.content.locator("action-text-attachment").boundingBox()
    const content = await editor.content.boundingBox()
    await clickAt(page, editor, content.x + 1, mention.y + mention.height / 2)

    await editor.send("Hi")
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(1)
    const value = await editor.value()
    expect(value).toContain("Hi")
    expect(value.indexOf("Hi")).toBeLessThan(value.indexOf("<action-text-attachment"))
  })

  test("clicking after a trailing mention places the caret after it", async ({ page, editor }) => {
    await insertMention(page, editor)

    // Well past the trailing space Lexxy inserts after a mention, so the click
    // lands clearly after the mention rather than on that space.
    const mention = await editor.content.locator("action-text-attachment").boundingBox()
    await clickAt(page, editor, mention.x + mention.width + 40, mention.y + mention.height / 2)

    await editor.send("Hi")
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(1)
    const value = await editor.value()
    expect(value).toContain("Hi")
    expect(value.indexOf("Hi")).toBeGreaterThan(value.indexOf("<action-text-attachment"))
  })
})
