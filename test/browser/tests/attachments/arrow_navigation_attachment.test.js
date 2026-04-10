import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Arrow key navigation near attachments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("down arrow moves to next text line, not to attachment", async ({ page, editor }) => {
    // Set up: two lines of text (using a line break within a paragraph) followed by an attachment
    await editor.setValue(
      "<p>First line<br>Second line</p>" +
        '<action-text-attachment content-type="image/png" url="/test.png" filename="test.png" filesize="1024" width="100" height="100"></action-text-attachment>',
    )
    await editor.flush()

    // Place cursor at the start of "First line"
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

    // Press down arrow — should move cursor to the second line, not select the attachment
    await editor.send("ArrowDown")

    // Verify: the attachment should NOT be selected
    const attachmentSelected = await page
      .locator("figure.attachment.node--selected")
      .count()
    expect(attachmentSelected).toBe(0)

    // Typing should insert into the text on the second line
    await editor.send("X")
    await editor.flush()

    const value = await editor.value()
    expect(value).toContain("Second line")
    expect(value).toContain("X")
  })

  test("down arrow from first paragraph moves to second paragraph, not attachment after it", async ({ page, editor }) => {
    // Set up: two paragraphs followed by an attachment
    await editor.setValue(
      "<p>First paragraph</p>" +
        "<p>Second paragraph</p>" +
        '<action-text-attachment content-type="image/png" url="/test.png" filename="test.png" filesize="1024" width="100" height="100"></action-text-attachment>',
    )
    await editor.flush()

    // Place cursor at the start of "First paragraph"
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

    // Press down arrow — should move to second paragraph, not the attachment
    await editor.send("ArrowDown")

    // Verify: the attachment should NOT be selected
    const attachmentSelected = await page
      .locator("figure.attachment.node--selected")
      .count()
    expect(attachmentSelected).toBe(0)

    // Typing should insert into the second paragraph
    await editor.send("X")
    await editor.flush()

    const value = await editor.value()
    expect(value).toContain("Second paragraph")
    expect(value).toContain("X")
  })

  test("up arrow from last paragraph moves to previous paragraph, not attachment before it", async ({ page, editor }) => {
    // Set up: an attachment followed by two paragraphs
    await editor.setValue(
      '<action-text-attachment content-type="image/png" url="/test.png" filename="test.png" filesize="1024" width="100" height="100"></action-text-attachment>' +
        "<p>First paragraph</p>" +
        "<p>Second paragraph</p>",
    )
    await editor.flush()

    // Place cursor at the start of "Second paragraph"
    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode())) {
        if (node.textContent === "Second paragraph") break
      }
      if (node) {
        const range = document.createRange()
        range.setStart(node, 0)
        range.collapse(true)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      }
    })
    await editor.flush()

    // Press up arrow — should move to first paragraph, not the attachment
    await editor.send("ArrowUp")

    // Verify: the attachment should NOT be selected
    const attachmentSelected = await page
      .locator("figure.attachment.node--selected")
      .count()
    expect(attachmentSelected).toBe(0)

    // Typing should insert into the first paragraph
    await editor.send("X")
    await editor.flush()

    const value = await editor.value()
    expect(value).toContain("First paragraph")
    expect(value).toContain("X")
  })

  test("up arrow selects attachment when cursor is mid-word on the first line of a paragraph below it", async ({ page, editor }) => {
    // Bug #871: image only selected when cursor at offset 0, skipped when mid-word
    await editor.setValue(
      "<p>Top paragraph</p>" +
        '<action-text-attachment content-type="image/png" url="/test.png" filename="test.png" filesize="1024" width="100" height="100"></action-text-attachment>' +
        "<p>Bottom paragraph</p>",
    )
    await editor.flush()

    // Place cursor at offset 6 in "Bottom paragraph" (after "Bottom")
    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode())) {
        if (node.textContent === "Bottom paragraph") break
      }
      if (node) {
        const range = document.createRange()
        range.setStart(node, 6)
        range.collapse(true)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      }
    })
    await editor.flush()

    // Press up arrow — should select the attachment above
    await editor.send("ArrowUp")

    const attachmentSelected = await page
      .locator("figure.attachment.node--selected")
      .count()
    expect(attachmentSelected).toBe(1)
  })

  test("down arrow selects attachment when cursor is mid-word on the last line of a paragraph above it", async ({ page, editor }) => {
    // Bug #871: symmetric case for down arrow
    await editor.setValue(
      "<p>Top paragraph</p>" +
        '<action-text-attachment content-type="image/png" url="/test.png" filename="test.png" filesize="1024" width="100" height="100"></action-text-attachment>' +
        "<p>Bottom paragraph</p>",
    )
    await editor.flush()

    // Place cursor at offset 3 in "Top paragraph" (after "Top")
    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      const firstText = walker.nextNode()
      if (firstText) {
        const range = document.createRange()
        range.setStart(firstText, 3)
        range.collapse(true)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      }
    })
    await editor.flush()

    // Press down arrow — should select the attachment below
    await editor.send("ArrowDown")

    const attachmentSelected = await page
      .locator("figure.attachment.node--selected")
      .count()
    expect(attachmentSelected).toBe(1)
  })
})
