import { test } from "../test_helper.js"
import { assertEditorHtml } from "../helpers/assertions.js"

test.describe("Paste: text with line breaks into blockquote", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("pasting plain text with single line break keeps all text inside blockquote", async ({
    page,
    editor,
  }) => {
    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    await editor.paste("line one\nline two")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<blockquote><p>line one<br>line two</p></blockquote>",
    )
  })

  test("pasting plain text with multiple line breaks keeps all text inside blockquote", async ({
    page,
    editor,
  }) => {
    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    await editor.paste("line one\nline two\nline three")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<blockquote><p>line one<br>line two<br>line three</p></blockquote>",
    )
  })

  test("pasting plain text with paragraph breaks keeps all text inside blockquote", async ({
    page,
    editor,
  }) => {
    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    await editor.paste("line one\n\nline two")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<blockquote><p>line one</p><p>line two</p></blockquote>",
    )
  })
})
