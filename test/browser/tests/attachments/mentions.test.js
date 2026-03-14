import { test } from "../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Mentions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("typing apostrophe-s after a mention has no space between mention and possessive", async ({ page, editor }) => {
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.send("Enter")
    await editor.flush()

    const mention = editor.content.locator("action-text-attachment")
    await expect(mention).toBeVisible({ timeout: 5_000 })

    await editor.content.pressSequentially("'s")
    await editor.flush()

    // The text node after the mention should not start with a regular space.
    // Lexical wraps text in <span data-lexical-text="true">, so look for that.
    const textAfterMention = await editor.content.evaluate((el) => {
      const attachment = el.querySelector("action-text-attachment")
      if (!attachment) return null
      const nextSpan = attachment.nextElementSibling
      if (!nextSpan || !nextSpan.hasAttribute("data-lexical-text")) return null
      return nextSpan.textContent
    })

    expect(textAfterMention).not.toBeNull()
    expect(textAfterMention).not.toMatch(/^ /)
    expect(textAfterMention).toContain("'s")
  })

  test("mention and possessive apostrophe-s do not break across lines", async ({ page, editor }) => {
    await editor.locator.evaluate((el) => {
      el.style.width = "200px"
    })

    await editor.send("Hello ")
    await editor.send("@")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.send("Enter")
    await editor.flush()

    const mention = editor.content.locator("action-text-attachment")
    await expect(mention).toBeVisible({ timeout: 5_000 })

    await editor.content.pressSequentially("'s")
    await editor.flush()

    // Verify the mention and 's are on the same line by checking their vertical positions
    const positions = await editor.content.evaluate((el) => {
      const attachment = el.querySelector("action-text-attachment")
      if (!attachment) return null

      const attachmentRect = attachment.getBoundingClientRect()

      // Find the text node containing 's after the attachment
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let textNode
      while ((textNode = walker.nextNode())) {
        if (textNode.textContent.includes("'s")) {
          const range = document.createRange()
          const idx = textNode.textContent.indexOf("'s")
          range.setStart(textNode, idx)
          range.setEnd(textNode, idx + 2)
          const textRect = range.getBoundingClientRect()
          return {
            mentionBottom: attachmentRect.bottom,
            mentionTop: attachmentRect.top,
            textTop: textRect.top,
            textBottom: textRect.bottom,
          }
        }
      }
      return null
    })

    expect(positions).not.toBeNull()
    // The mention and 's should be on the same line (their vertical positions should overlap)
    expect(positions.textTop).toBeLessThan(positions.mentionBottom)
    expect(positions.textBottom).toBeGreaterThan(positions.mentionTop)
  })
})
