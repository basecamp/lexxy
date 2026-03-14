import { test } from "../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Arrow key navigation near attachments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("right arrow through formatted text does not jump to attachment", async ({ page, editor }) => {
    // Set up: italic text followed by plain text, then an image attachment
    await editor.setValue(
      '<p><em>italic</em> plain</p>' +
      '<action-text-attachment content-type="image/png" url="/test.png" filename="test.png" filesize="1024" width="100" height="100"></action-text-attachment>',
    )
    await editor.flush()

    // Place cursor at the start of the italic text
    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      const firstText = walker.nextNode()
      const range = document.createRange()
      range.setStart(firstText, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })
    await editor.flush()

    // Arrow right through "italic" (6 chars) — lands at end of italic text
    for (let i = 0; i < 6; i++) {
      await editor.send("ArrowRight")
    }

    // Now at the boundary between italic and plain text.
    // The next ArrowRight should move into " plain", NOT jump to the attachment.
    await editor.send("ArrowRight")

    // Verify: the attachment should not be selected
    const attachmentSelected = await page.locator("figure.attachment.node--selected").count()
    expect(attachmentSelected).toBe(0)

    // Typing should insert into the text, confirming cursor is in the text
    await editor.send("X")
    await editor.flush()

    const value = await editor.value()
    expect(value).toContain("X")
    expect(value).toContain("plain")
  })

  test("left arrow through formatted text does not jump to attachment", async ({ page, editor }) => {
    // Set up: an image attachment, then a paragraph with plain text followed by italic text
    await editor.setValue(
      '<action-text-attachment content-type="image/png" url="/test.png" filename="test.png" filesize="1024" width="100" height="100"></action-text-attachment>' +
      '<p>plain <em>italic</em></p>',
    )
    await editor.flush()

    // Place cursor at the end of the paragraph's last text node
    await editor.content.evaluate((el) => {
      // Walk all text nodes and find the last one (the italic text)
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node
      let lastText = null
      while ((node = walker.nextNode())) {
        lastText = node
      }
      if (lastText) {
        const range = document.createRange()
        range.setStart(lastText, lastText.textContent.length)
        range.collapse(true)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      }
    })
    await editor.flush()

    // Arrow left through "italic" (6 chars) — lands at start of italic text
    for (let i = 0; i < 6; i++) {
      await editor.send("ArrowLeft")
    }

    // Now at the boundary between plain and italic text.
    // The next ArrowLeft should move into "plain ", NOT jump to the attachment.
    await editor.send("ArrowLeft")

    // Verify: the attachment should not be selected
    const attachmentSelected = await page.locator("figure.attachment.node--selected").count()
    expect(attachmentSelected).toBe(0)

    // Typing should insert into the text, confirming cursor is in the text
    await editor.send("X")
    await editor.flush()

    const value = await editor.value()
    expect(value).toContain("plain")
    expect(value).toContain("X")
  })
})
