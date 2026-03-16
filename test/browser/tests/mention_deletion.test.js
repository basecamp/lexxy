import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../helpers/assertions.js"

const mentionHtml = [
  '<action-text-attachment',
  ' content-type="application/vnd.actiontext.mention"',
  ' sgid="test-sgid-123"',
  ' content="&lt;span class=&quot;person&quot;&gt;Alice&lt;/span&gt;"',
  ">Alice</action-text-attachment>",
].join("")

const mention2Html = [
  '<action-text-attachment',
  ' content-type="application/vnd.actiontext.mention"',
  ' sgid="test-sgid-456"',
  ' content="&lt;span class=&quot;person&quot;&gt;Bob&lt;/span&gt;"',
  ">Bob</action-text-attachment>",
].join("")

test.describe("Mention deletion cursor position", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("selecting mention with shift+right and deleting removes it without cursor jump", async ({ page, editor }) => {
    await editor.setValue(`<p>Hello ${mentionHtml} world</p>`)
    await editor.flush()
    await expect(editor.content.locator("action-text-attachment")).toBeVisible()

    // Place cursor just before the mention
    await editor.content.click()
    await editor.select("Hello")
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("ArrowRight")
    }
    await editor.flush()

    // Shift+Right to select through the mention's text content
    await page.keyboard.press("Shift+ArrowRight")
    await editor.flush()

    // Delete the selection
    await page.keyboard.press("Backspace")
    await editor.flush()

    // The mention should be gone — no "Alice" text should remain
    const text = await editor.content.evaluate((el) => el.textContent)
    expect(text).not.toContain("Alice")
    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)
  })

  test("selecting mention with shift+left and deleting removes it without cursor jump", async ({ page, editor }) => {
    await editor.setValue(`<p>Start ${mentionHtml} end</p>`)
    await editor.flush()
    await expect(editor.content.locator("action-text-attachment")).toBeVisible()

    // Place cursor just after the mention
    await editor.content.click()
    await editor.select("end")
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("ArrowLeft")
    }
    await editor.flush()

    // Shift+Left to select backwards through the mention text content
    await page.keyboard.press("Shift+ArrowLeft")
    await editor.flush()

    // Delete the selection
    await page.keyboard.press("Backspace")
    await editor.flush()

    // The mention should be gone
    const text = await editor.content.evaluate((el) => el.textContent)
    expect(text).not.toContain("Alice")
    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)
  })

  test("after deleting shift-selected mention, typing inserts text at the correct position", async ({ page, editor }) => {
    await editor.setValue(`<p>Before ${mentionHtml} after</p>`)
    await editor.flush()
    await expect(editor.content.locator("action-text-attachment")).toBeVisible()

    // Click the mention to select it as a node
    await editor.content.locator("action-text-attachment").click()
    await editor.flush()

    // Extend selection to include mention via shift
    await page.keyboard.press("Shift+ArrowRight")
    await editor.flush()

    // Delete
    await page.keyboard.press("Backspace")
    await editor.flush()

    // Type a marker
    await page.keyboard.press("X")
    await editor.flush()

    // The marker should appear where the mention was, between "Before" and "after"
    const text = await editor.content.evaluate((el) => el.textContent)
    expect(text).not.toContain("Alice")
    expect(text).toMatch(/Before[\s]*X[\s]*after/)
  })

  test("with multiple mentions, deleting first via click+backspace does not jump to second", async ({ page, editor }) => {
    await editor.setValue(`<p>Hello ${mentionHtml} and ${mention2Html} bye</p>`)
    await editor.flush()
    await expect(editor.content.locator("action-text-attachment")).toHaveCount(2)

    // Click the first mention
    await editor.content.locator("action-text-attachment").first().click()
    await editor.flush()

    // Delete
    await page.keyboard.press("Backspace")
    await editor.flush()

    // Type marker
    await page.keyboard.press("X")
    await editor.flush()

    // X should appear where Alice was, not near Bob
    await assertEditorContent(editor, async (content) => {
      const text = await content.evaluate((el) => el.textContent)
      expect(text).not.toContain("Alice")
      expect(text).toMatch(/Hello[\s]*X/)
      await expect(content.locator("action-text-attachment")).toHaveCount(1)
    })
  })
})
