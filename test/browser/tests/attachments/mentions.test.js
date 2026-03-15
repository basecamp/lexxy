import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

function mentionHtml(name) {
  return [
    "<action-text-attachment",
    ' content-type="application/vnd.actiontext.mention"',
    ' sgid="test-sgid-123"',
    ` content="&lt;span class=&quot;mention&quot;&gt;@${name}&lt;/span&gt;"`,
    `>@${name}</action-text-attachment>`,
  ].join("")
}

test.describe("Mentions", () => {
  test.describe("via prompt system", () => {
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

    test("comma after a mention stays on the same line", async ({ page, editor }) => {
      await editor.locator.evaluate((el) => {
        el.style.width = "200px"
      })

      await editor.send("Hello ")
      await editor.send("@")

      const popover = page.locator(".lexxy-prompt-menu--visible")
      await expect(popover).toBeVisible({ timeout: 5_000 })

      await editor.send("Enter")

      const mention = editor.content.locator("action-text-attachment")
      await expect(mention).toBeVisible({ timeout: 5_000 })

      await editor.send(", right?")
      await editor.flush()

      // Verify the mention and comma are on the same line by checking their vertical positions
      const positions = await editor.content.evaluate((el) => {
        const attachment = el.querySelector("action-text-attachment")
        if (!attachment) return null

        const attachmentRect = attachment.getBoundingClientRect()

        // Find the text node containing the comma after the attachment
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        let textNode
        while ((textNode = walker.nextNode())) {
          if (textNode.textContent.includes(",")) {
            const range = document.createRange()
            const idx = textNode.textContent.indexOf(",")
            range.setStart(textNode, idx)
            range.setEnd(textNode, idx + 1)
            const textRect = range.getBoundingClientRect()
            return {
              mentionBottom: attachmentRect.bottom,
              mentionTop: attachmentRect.top,
              commaTop: textRect.top,
              commaBottom: textRect.bottom,
            }
          }
        }
        return null
      })

      expect(positions).not.toBeNull()
      expect(positions.commaTop).toBeLessThan(positions.mentionBottom)
      expect(positions.commaBottom).toBeGreaterThan(positions.mentionTop)
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
      expect(positions.textTop).toBeLessThan(positions.mentionBottom)
      expect(positions.textBottom).toBeGreaterThan(positions.mentionTop)
    })
  })

  test("punctuation after mention stays on the same line at all widths", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.setValue(
      `<p>Regarding ${mentionHtml("Zacharias")}, how are you doing today?</p>`,
    )
    await editor.flush()

    // Shrink the editor progressively. At every width where the mention fits
    // on one line, the comma must also be on that same line.
    const commaStaysGlued = await editor.content.evaluate((content) => {
      const attachment = content.querySelector("action-text-attachment")
      const editor = content.closest("lexxy-editor")

      function getCommaRect() {
        const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT)
        let node
        while ((node = walker.nextNode())) {
          const idx = node.textContent.indexOf(",")
          if (idx !== -1) {
            const range = document.createRange()
            range.setStart(node, idx)
            range.setEnd(node, idx + 1)
            return range.getBoundingClientRect()
          }
        }
        return null
      }

      function mentionOnOneLine() {
        const r = attachment.getBoundingClientRect()
        return r.width > 0 && r.height < 30
      }

      for (let w = 250; w >= 120; w--) {
        editor.style.width = `${w}px`
        if (!mentionOnOneLine()) continue

        const attachmentRect = attachment.getBoundingClientRect()
        const commaRect = getCommaRect()
        if (!commaRect) continue

        const commaOnSameLine = Math.abs(commaRect.top - attachmentRect.top) < attachmentRect.height
        if (!commaOnSameLine) return false
      }
      return true
    })

    expect(commaStaysGlued).toBe(true)
  })
})
