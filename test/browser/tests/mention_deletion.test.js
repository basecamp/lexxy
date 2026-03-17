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

test.describe("Backspace after mention in list item", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("backspace after mention in list item selects the mention instead of outdenting", async ({ page, editor }) => {
    // Set up a list item containing only a mention (importDOM adds word joiner after it)
    await editor.setValue(`<ul><li>${mentionHtml}</li></ul>`)
    await editor.flush()
    await expect(editor.content.locator("action-text-attachment")).toBeVisible()

    // Place cursor right after the decorator node using JS to ensure precise positioning
    await editor.content.evaluate((el) => {
      const attachment = el.querySelector("action-text-attachment")
      if (!attachment) throw new Error("No action-text-attachment found in editor")

      const wordJoinerSpan = attachment.nextElementSibling
      if (!wordJoinerSpan?.firstChild) throw new Error("No word joiner span/text node found after mention")

      const textNode = wordJoinerSpan.firstChild
      const range = document.createRange()
      range.setStart(textNode, textNode.textContent.length)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })
    await editor.flush()

    // First backspace: deletes the invisible word joiner
    // Second backspace: should select the mention, NOT outdent the list item
    await editor.send("Backspace", "Backspace")

    // The list should still exist (not outdented to a paragraph)
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("ul")).toHaveCount(1)
    })

    // The mention should be selected (node--selected class)
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator(".node--selected")).toHaveCount(1)
    })
  })
})

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
    await page.keyboard.press("Home")
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("ArrowRight")
    }
    await editor.flush()

    // Shift+Right to select through the mention's text content ("Alice" = 5 chars)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Shift+ArrowRight")
    }
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
    await page.keyboard.press("End")
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowLeft")
    }
    await editor.flush()

    // Shift+Left to select backwards through the mention text content ("Alice" = 5 chars)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Shift+ArrowLeft")
    }
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
