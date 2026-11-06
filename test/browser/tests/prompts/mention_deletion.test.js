import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../../helpers/assertions.js"

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

  test("backspace after mention in list item deletes the mention instead of outdenting", async ({ page, editor }) => {
    // Set up a list item containing only a mention
    await editor.setValue(`<ul><li>${mentionHtml}</li></ul>`)
    await editor.flush()
    await expect(editor.content.locator("action-text-attachment")).toBeVisible()

    // Place cursor at the end of the list item (after the mention)
    await editor.content.locator("ul li").click()
    await editor.send("End")
    await editor.flush()

    // Backspace should delete the mention, NOT outdent the list item
    await editor.send("Backspace")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("ul")).toHaveCount(1)
      await expect(content.locator("action-text-attachment")).toHaveCount(0)
    })
  })
})

// A mention deletes like a character of text: one Backspace or Delete removes it
// and the caret stays where it was. Selecting it first would take the caret
// away, and Android dismisses the on-screen keyboard when there is no caret.
test.describe("Deleting a mention like text", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  async function expectCaretInEditor(editor) {
    const caret = await editor.content.evaluate((el) => {
      const selection = window.getSelection()
      return { ranges: selection.rangeCount, collapsed: selection.isCollapsed, inside: el.contains(selection.anchorNode) }
    })
    expect(caret).toEqual({ ranges: 1, collapsed: true, inside: true })
  }

  test("backspace after a mention deletes it in one press and keeps the caret", async ({ editor }) => {
    await editor.setValue(`<p>Hello ${mentionHtml} world</p>`)
    await editor.flush()
    await editor.placeCaretInside(" world", 0)

    await editor.send("Backspace")

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)
    await expect(editor.content.locator(".node--selected")).toHaveCount(0)
    await expectCaretInEditor(editor)

    await editor.send("X")
    await assertEditorHtml(editor, "<p>Hello X world</p>")
  })

  test("delete before a mention deletes it in one press and keeps the caret", async ({ editor }) => {
    await editor.setValue(`<p>Hello ${mentionHtml} world</p>`)
    await editor.flush()
    await editor.placeCaretInside("Hello ", 6)

    await editor.send("Delete")

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)
    await expectCaretInEditor(editor)

    await editor.send("X")
    await assertEditorHtml(editor, "<p>Hello X world</p>")
  })

  // The Android keyboard sends no usable keydown for Backspace (key code 229),
  // only a deleteContentBackward beforeinput event. Playwright can't drive an
  // Android IME, so this dispatches that event the way the IME does.
  test("an Android keyboard's backspace after a mention deletes it and keeps the caret", async ({ editor }) => {
    await editor.setValue(`<p>Hello ${mentionHtml} world</p>`)
    await editor.flush()
    await editor.placeCaretInside(" world", 0)

    await editor.content.evaluate((el) => {
      el.dispatchEvent(new InputEvent("beforeinput", { inputType: "deleteContentBackward", bubbles: true, cancelable: true }))
    })
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)
    await expect(editor.content.locator(".node--selected")).toHaveCount(0)
    await expectCaretInEditor(editor)
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
    await editor.send("Home")
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
    await editor.send("End")
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

    // The marker should appear where the mention was, between "Before" and "after", consuming the adjacent space
    const text = await editor.content.evaluate((el) => el.textContent)
    expect(text).not.toContain("Alice")
    expect(text).toMatch(/Before[\s]*Xafter/)
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

// Images are easier to remove with touch, so Backspace still selects them first.
test.describe("Backspace after an image", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("selects the image instead of deleting it", async ({ editor }) => {
    await editor.setValue(
      '<action-text-attachment content-type="image/png" url="http://example.com/image.png" filename="photo.png"></action-text-attachment>' +
      "<p>Hello</p>",
    )
    await editor.flush()
    await editor.placeCaretInside("Hello", 0)

    await editor.send("Backspace")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("figure")).toHaveCount(1)
      await expect(content.locator("figure.node--selected")).toHaveCount(1)
    })
  })
})
