import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../helpers/assertions.js"

const HELLO_EVERYONE = "<p>Hello everyone</p>"

async function placeCaretAtEndOfInlineCode(editor) {
  await editor.content.evaluate((content) => {
    const code = content.querySelector("code")
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
    const textNode = walker.nextNode()
    const range = document.createRange()

    range.setStart(textNode, textNode.textContent.length)
    range.collapse(true)

    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  })
}

test.describe("Toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("bold", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Bold" }).click()
    await assertEditorHtml(editor, "<p>Hello <b><strong>everyone</strong></b></p>")
  })

  test("italic", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Italic" }).click()
    await assertEditorHtml(editor, "<p>Hello <i><em>everyone</em></i></p>")
  })

  test("strikethrough", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Strikethrough" }).click()
    await assertEditorHtml(editor, "<p>Hello <s>everyone</s></p>")
  })

  test("color highlighting", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await applyHighlightOption(page, "color", 1)
    await assertEditorHtml(
      editor,
      '<p>Hello <mark style="color: var(--highlight-1);">everyone</mark></p>',
    )
  })

  test("background color highlighting", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await applyHighlightOption(page, "background-color", 1)
    await assertEditorHtml(
      editor,
      '<p>Hello <mark style="background-color: var(--highlight-bg-1);">everyone</mark></p>',
    )
  })

  test("color and background highlighting", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await applyHighlightOption(page, "color", 1)

    await editor.select("everyone")
    await applyHighlightOption(page, "background-color", 1)

    await assertEditorHtml(
      editor,
      '<p>Hello <mark style="color: var(--highlight-1);background-color: var(--highlight-bg-1);">everyone</mark></p>',
    )
  })

  test("bold and color highlighting", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Bold" }).click()

    await editor.select("everyone")
    await applyHighlightOption(page, "color", 1)

    await assertEditorHtml(
      editor,
      '<p>Hello <b><mark style="color: var(--highlight-1);"><strong>everyone</strong></mark></b></p>',
    )
  })

  test("rotate headers", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")

    await page.getByRole("button", { name: "Heading" }).click()
    await assertEditorHtml(editor, "<h2>Hello everyone</h2>")

    await page.getByRole("button", { name: "Heading" }).click()
    await assertEditorHtml(editor, "<h3>Hello everyone</h3>")

    await page.getByRole("button", { name: "Heading" }).click()
    await assertEditorHtml(editor, "<h4>Hello everyone</h4>")

    await page.getByRole("button", { name: "Heading" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("bullet list", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<ul><li>Hello everyone</li></ul>")
  })

  test("numbered list", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, "<ol><li>Hello everyone</li></ol>")
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

  test("insert quote without selection", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(
      editor,
      "<blockquote><p>Hello everyone</p></blockquote>",
    )
  })

  test("quote", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")

    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(
      editor,
      "<blockquote><p>Hello everyone</p></blockquote>",
    )

    await editor.select("everyone")
    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(editor, "<p>Hello everyone</p>")
  })

  test("multi line quote", async ({ page, editor }) => {
    await editor.setValue("<p>Hello</p><p>Everyone</p>")
    await editor.selectAll()
    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(
      editor,
      "<blockquote><p>Hello</p><p>Everyone</p></blockquote>",
    )
  })

  test("links", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
    await editor.flush()

    // Open the link dropdown programmatically to avoid focus/selection loss
    // that occurs with a real click on the summary element
    await page.evaluate(() => {
      const details = document.querySelector(
        "details:has(summary[name='link'])",
      )
      details.open = true
      details.dispatchEvent(new Event("toggle"))
    })

    const input = page.locator("lexxy-link-dropdown input[type='url']").first()
    await expect(input).toBeVisible({ timeout: 2_000 })
    await input.fill("https://37signals.com")
    await page
      .locator("lexxy-link-dropdown button[value='link']")
      .first()
      .click()

    await assertEditorHtml(
      editor,
      '<p>Hello <a href="https://37signals.com">everyone</a></p>',
    )
  })

  test("disable toolbar", async ({ page }) => {
    await expect(page.locator("lexxy-toolbar")).toBeVisible()

    await page.goto("/toolbar-disabled.html")
    await expect(page.locator("lexxy-toolbar")).toHaveCount(0)
  })

  test("attachments icon display", async ({ page }) => {
    await expect(
      page.locator("lexxy-toolbar button[name=upload]"),
    ).toBeVisible()

    await page.goto("/attachments-disabled.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=upload]"),
    ).toBeHidden()

    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=upload]"),
    ).toBeVisible()

    await page.goto("/")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=upload]"),
    ).toBeVisible()

    await page.goto("/attachments-invalid.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=upload]"),
    ).toBeVisible()
  })

  test("keyboard navigation in toolbar", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)

    const boldButton = page.locator("lexxy-toolbar button[name='bold']")
    await boldButton.focus()

    const focusedName = () =>
      page.evaluate(() => document.activeElement?.getAttribute("name"))

    await expect.poll(focusedName).toBe("bold")

    await page.keyboard.press("ArrowRight")
    await expect.poll(focusedName).toBe("italic")

    await page.keyboard.press("ArrowLeft")
    await expect.poll(focusedName).toBe("bold")
  })

  test("undo and redo commands", async ({ page, editor }) => {
    await editor.send("Hello World")
    await assertEditorHtml(editor, "<p>Hello World</p>")

    // Undo until the undo button is disabled (editor is back to initial state)
    const undoButton = page.getByRole("button", { name: "Undo" })
    while (await undoButton.evaluate((el) => !el.disabled)) {
      await undoButton.click()
      await editor.flush()
    }
    await assertEditorHtml(editor, "<p><br></p>")

    // Redo until the redo button is disabled
    const redoButton = page.getByRole("button", { name: "Redo" })
    while (await redoButton.evaluate((el) => !el.disabled)) {
      await redoButton.click()
      await editor.flush()
    }
    await assertEditorHtml(editor, "<p>Hello World</p>")
  })

  test("external toolbar", async ({ page }) => {
    await page.goto("/toolbar-external.html")
    await expect(
      page.locator("lexxy-toolbar#external_toolbar[connected]"),
    ).toBeVisible()
  })
})

// Helper: mirrors ToolbarHelper#apply_highlight_option
async function applyHighlightOption(page, attribute, buttonIndex) {
  await page.locator("[name='highlight']").click()
  const buttons = page.locator(
    `lexxy-highlight-dropdown .lexxy-highlight-colors .lexxy-highlight-button[data-style='${attribute}']`,
  )
  await buttons.nth(buttonIndex - 1).click()
}
