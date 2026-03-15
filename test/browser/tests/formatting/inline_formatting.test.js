import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { HELLO_EVERYONE, placeCaretAtEndOfInlineCode } from "../../helpers/toolbar.js"

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
})
