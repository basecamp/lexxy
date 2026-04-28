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

  test("pasting multi-line content into a quote started via the markdown shortcut keeps every line inside the quote", async ({
    page,
    editor,
  }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()

    // Start the quote via the markdown shortcut (`>` + space).
    // This path used to leave a QuoteNode with no ParagraphNode child,
    // unlike the toolbar button which wraps an existing paragraph.
    await editor.click()
    await editor.send("> ")
    // Wait for the QuoteNode transform to add the <p> child before pasting,
    // otherwise the paste can race the transform and escape the quote.
    await expect
      .poll(async () => {
        await editor.flush()
        return await editor.value()
      })
      .toBe("<blockquote><p><br></p></blockquote>")

    await editor.paste("First paragraph\nSecond paragraph", {
      html: "<p>First paragraph</p><p>Second paragraph</p>",
    })
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<blockquote><p>First paragraph</p><p>Second paragraph</p></blockquote>",
    )
  })

  test("the QuoteNode transform does not re-wrap toolbar-button quote children", async ({
    page,
    editor,
  }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()

    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    await editor.paste("First paragraph\nSecond paragraph", {
      html: "<p>First paragraph</p><p>Second paragraph</p>",
    })
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<blockquote><p>First paragraph</p><p>Second paragraph</p></blockquote>",
    )
  })
})
