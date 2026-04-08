import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import {
  HELLO_EVERYONE,
  clickToolbarButton,
  placeCaretAtEndOfInlineCode,
} from "../../helpers/toolbar.js"

test.describe("Inline formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("bold", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Bold" }).click()
    await assertEditorHtml(editor, "<p>Hello <strong>everyone</strong></p>")
  })

  test("italic", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Italic" }).click()
    await assertEditorHtml(editor, "<p>Hello <em>everyone</em></p>")
  })

  test("strikethrough", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await clickToolbarButton(page, "strikethrough")
    await assertEditorHtml(editor, "<p>Hello <s>everyone</s></p>")
  })

  test("underline via keyboard shortcut", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")

    const modifier = process.platform === "darwin" ? "Meta" : "Control"
    await editor.content.press(`${modifier}+u`)
    await assertEditorHtml(editor, "<p>Hello <u>everyone</u></p>")
  })

  test("underline round-trips through setValue/value", async ({ editor }) => {
    await editor.setValue("<p>Hello <u>everyone</u></p>")
    await assertEditorHtml(editor, "<p>Hello <u>everyone</u></p>")
  })

  test("toggle code for selected words", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")

    await page.getByRole("button", { name: "Code" }).click()
    await assertEditorHtml(editor, "<p>Hello <code>everyone</code></p>")

    await editor.select("everyone")
    await page.getByRole("button", { name: "Code" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("typing after moving the caret out of inline code inserts plain text", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>Hello <code>code</code></p>")

    const codeButton = page.getByRole("button", { name: "Code" })

    await editor.content.locator("code").click()
    await expect(codeButton).toHaveAttribute("aria-pressed", "true")

    await placeCaretAtEndOfInlineCode(editor)
    await editor.send("ArrowRight")
    await editor.send("!")

    await assertEditorHtml(editor, "<p>Hello <code>code</code>!</p>")
    await expect(codeButton).toHaveAttribute("aria-pressed", "false")
  })

  test("clicking plain text after inline code clears the active code state", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>Hello <code>code</code> world</p>")

    const codeButton = page.getByRole("button", { name: "Code" })

    await editor.content.locator("code").click()
    await expect(codeButton).toHaveAttribute("aria-pressed", "true")

    await editor.content.getByText("world").click()

    await expect(codeButton).toHaveAttribute("aria-pressed", "false")
  })

  test("deleting all inline code text clears the code format", async ({ page, editor }) => {
    await editor.setValue("<p><code>hello</code></p>")

    const codeButton = page.getByRole("button", { name: "Code" })

    // Select the code text and verify code button is active
    await editor.select("hello")
    await expect(codeButton).toHaveAttribute("aria-pressed", "true")

    // Delete the selected code text
    await editor.send("Backspace")

    // The code button should no longer be active
    await expect(codeButton).toHaveAttribute("aria-pressed", "false")

    // Typing new text should NOT be code-formatted
    await editor.send("world")
    await assertEditorHtml(editor, "<p>world</p>")
  })

  test("applying code to text with mixed formatting produces a single code element", async ({
    page,
    editor,
  }) => {
    await editor.setValue(
      "<p>Hello <strong>bold</strong> and <em>italic</em> world</p>",
    )
    await editor.selectAll()
    await page.getByRole("button", { name: "Code" }).click()
    await assertEditorHtml(editor, "<p><code>Hello bold and italic world</code></p>")
  })

  test("applying code to partial selection across mixed formats merges selected text and preserves surrounding formatting", async ({
    page,
    editor,
  }) => {
    await editor.setValue(
      "<p>Hello <strong>bold text</strong> and <em>italic text</em> world</p>",
    )

    // Select "bold text and italic" — a partial selection spanning mixed formats
    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let startNode, endNode
      let node
      while ((node = walker.nextNode())) {
        if (node.nodeValue.includes("bold text")) startNode = node
        if (node.nodeValue.includes("italic text")) endNode = node
      }
      const range = document.createRange()
      range.setStart(startNode, 0)
      range.setEnd(endNode, "italic".length)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })
    await editor.flush()

    await page.getByRole("button", { name: "Code" }).click()

    await assertEditorHtml(
      editor,
      "<p>Hello <code>bold text and italic</code><em> text</em> world</p>",
    )
  })

  test("toggle code for block", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.click()

    await page.getByRole("button", { name: "Code" }).click()
    await assertEditorHtml(
      editor,
      '<pre data-language="plain" data-highlight-language="plain">Hello everyone</pre>',
    )

    await page.getByRole("button", { name: "Code" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("selecting multiple lines and toggling code block creates a single code block", async ({ page, editor }) => {
    await editor.send("Line one")
    await editor.send("Enter")
    await editor.send("Line two")
    await editor.send("Enter")
    await editor.send("Line three")

    await editor.selectAll()
    await page.getByRole("button", { name: "Code" }).click()

    await assertEditorHtml(
      editor,
      '<pre data-language="plain" data-highlight-language="plain">Line one<br>Line two<br>Line three</pre>',
    )
  })

  test("toggling off a multi-line code block restores separate paragraphs", async ({ page, editor }) => {
    await editor.send("Line one")
    await editor.send("Enter")
    await editor.send("Line two")
    await editor.send("Enter")
    await editor.send("Line three")

    await editor.selectAll()
    await page.getByRole("button", { name: "Code" }).click()

    await assertEditorHtml(
      editor,
      '<pre data-language="plain" data-highlight-language="plain">Line one<br>Line two<br>Line three</pre>',
    )

    await editor.selectAll()
    await page.getByRole("button", { name: "Code" }).click()

    await assertEditorHtml(
      editor,
      "<p>Line one</p><p>Line two</p><p>Line three</p>",
    )
  })

  test("toggling code block on a blockquote with multiple paragraphs preserves all lines", async ({ page, editor }) => {
    await editor.setValue("<blockquote><p>Line one</p><p>Line two</p></blockquote>")
    await editor.selectAll()
    await page.getByRole("button", { name: "Code" }).click()

    await assertEditorHtml(
      editor,
      '<blockquote><pre data-language="plain" data-highlight-language="plain">Line one<br>Line two</pre></blockquote>',
    )
  })
})
