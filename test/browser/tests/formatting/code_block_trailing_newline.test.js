import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Code block trailing newline", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("importing a pre with a trailing newline does not add a blank last line", async ({ editor }) => {
    await editor.setValue("<pre data-language=\"plain\">Last updated: today\n</pre>")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<pre data-language=\"plain\" data-highlight-language=\"plain\">Last updated: today</pre>",
    )
  })

  test("importing a multi-line pre with a trailing newline keeps interior line breaks", async ({ editor }) => {
    await editor.setValue("<pre data-language=\"plain\">line one\nline two\n</pre>")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<pre data-language=\"plain\" data-highlight-language=\"plain\">line one<br>line two</pre>",
    )
  })

  test("importing a pre without a trailing newline stays unchanged", async ({ editor }) => {
    await editor.setValue("<pre data-language=\"plain\">line one\nline two</pre>")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<pre data-language=\"plain\" data-highlight-language=\"plain\">line one<br>line two</pre>",
    )
  })
})
