import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { placeCaretAtEndOfInlineCode } from "../../helpers/toolbar.js"

test.describe("Inline code escape with arrow keys", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("right arrow escapes inline code when there is a following paragraph", async ({ page, editor }) => {
    await editor.setValue("<p>Hello <code>code</code></p><p>next line</p>")

    await placeCaretAtEndOfInlineCode(editor)
    await editor.send("ArrowRight")
    await editor.send(" world")

    await assertEditorHtml(editor, "<p>Hello <code>code</code> world</p><p>next line</p>")
  })

  test("right arrow escapes inline code in a list item", async ({ page, editor }) => {
    await editor.setValue("<ul><li>item <code>code</code></li></ul>")

    await placeCaretAtEndOfInlineCode(editor)
    await editor.send("ArrowRight")
    await editor.send(" more")

    await assertEditorHtml(editor, "<ul><li>item <code>code</code> more</li></ul>")
  })

  test("right arrow escapes inline code when code is only content in paragraph", async ({ page, editor }) => {
    await editor.setValue("<p><code>code</code></p><p>next</p>")

    await placeCaretAtEndOfInlineCode(editor)
    await editor.send("ArrowRight")
    await editor.send(" after")

    await assertEditorHtml(editor, "<p><code>code</code> after</p><p>next</p>")
  })

  test("right arrow escapes inline code created via backtick shortcut", async ({ editor }) => {
    await editor.send("`code`")
    await editor.send("ArrowRight")
    await editor.send(" plain")

    const codeButton = editor.page.getByRole("button", { name: "Code" })
    await expect(codeButton).toHaveAttribute("aria-pressed", "false")
  })
})
