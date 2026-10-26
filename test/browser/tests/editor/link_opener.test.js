import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const modifier = process.platform === "darwin" ? "Meta" : "Control"

test.describe("Link opener", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue('<p>Visit <a href="https://example.com">example</a> today</p>')
    await editor.flush()
  })

  test("modifier+click opens the link in a new tab", async ({ editor, context }) => {
    const anchor = editor.content.locator("a")

    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      anchor.click({ modifiers: [modifier] }),
    ])

    await newPage.waitForLoadState("load")
    expect(newPage.url()).toBe("https://example.com/")
  })

  test("plain click does not open the link", async ({ editor, context }) => {
    const anchor = editor.content.locator("a")

    await anchor.click()
    const newPage = await context.waitForEvent("page", { timeout: 200 }).catch(() => null)

    expect(newPage).toBeNull()
  })

  test("holding modifier sets data-links-openable on the editor", async ({ page, editor }) => {
    await expect(editor.locator).not.toHaveAttribute("data-links-openable")
    await page.keyboard.down(modifier)
    await expect(editor.locator).toHaveAttribute("data-links-openable")
    await page.keyboard.up(modifier)
    await expect(editor.locator).not.toHaveAttribute("data-links-openable")
  })

  test("does not set contenteditable on links when modifier is held", async ({ page, editor }) => {
    const anchor = editor.content.locator("a")

    await page.keyboard.down(modifier)
    await expect(anchor).not.toHaveAttribute("contenteditable")
    await page.keyboard.up(modifier)
  })
})
