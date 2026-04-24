import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Paste into quote", () => {
  test("pasting text at a specific cursor position within a quote inserts at that position", async ({
    page,
    editor,
  }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()

    // Set up a blockquote with text and place cursor in the middle
    await editor.setValue("<blockquote><p>Hello World</p></blockquote>")
    await editor.focus()

    // Place cursor after "Hello" using Home then 5x ArrowRight
    await editor.send("Home")
    for (let i = 0; i < 5; i++) await editor.send("ArrowRight")
    await editor.flush()

    await editor.paste("INSERTED", { html: "<span>INSERTED</span>" })
    await editor.flush()

    // The pasted text should appear at cursor position, not at the end
    await assertEditorHtml(editor, "<blockquote><p>HelloINSERTED World</p></blockquote>")
  })

  test("pasting HTML into a quote does not make the editor unresponsive", async ({
    page,
    editor,
  }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()

    // Create a quote block via the toolbar
    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    // Track console errors
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    // Paste HTML content (this is what triggers the unresponsive state)
    await editor.paste("First paragraph\nSecond paragraph", {
      html: "<p>First paragraph</p><p>Second paragraph</p>",
    })
    await editor.flush()

    // Editor should remain responsive - verify by typing after paste
    await editor.send(" more text")
    await editor.flush()

    // No console errors should have occurred
    expect(errors).toHaveLength(0)

    // Content should be inside the blockquote
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toHaveCount(1)
      await expect(content.locator("blockquote")).toContainText("Second paragraph more text")
    })
  })

  test("pasting into a quote does not prepend an extra blank line", async ({
    page,
    editor,
  }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()

    // Create a quote block
    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    // Paste a sentence (simulates copying from Basecamp)
    await editor.paste("A copied sentence", {
      html: "<span>A copied sentence</span>",
    })
    await editor.flush()

    // The pasted content should start on the first line of the quote,
    // not on a second line after a blank first line
    await assertEditorHtml(editor, "<blockquote><p>A copied sentence</p></blockquote>")
  })
})
