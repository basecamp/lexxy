import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

test.describe("Paste — Code block", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("pasting text with blank lines into a code block keeps all content inside", async ({ editor }) => {
    await editor.setValue("<pre><code>existing code</code></pre>")
    await editor.content.locator("code").click()
    await editor.send("End")
    await editor.flush()

    await editor.paste("line one\n\nline two\n\nline three")
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      const code = content.locator("code")
      await expect(code).toHaveCount(1)
      await expect(code).toContainText("existing code")
      await expect(code).toContainText("line one")
      await expect(code).toContainText("line two")
      await expect(code).toContainText("line three")

      // No content should have escaped to paragraphs outside the code block
      const outerParagraphs = content.locator(":scope > p:not(.provisional-paragraph)")
      await expect(outerParagraphs).toHaveCount(0)
    })
  })

  test("pasting text with blank lines into an empty code block keeps all content inside", async ({ editor }) => {
    await editor.click()
    await editor.clickToolbarButton("insertCodeBlock")
    await editor.flush()

    await editor.paste("function hello() {\n  console.log('hi')\n\n  return true\n}")
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      const code = content.locator("code")
      await expect(code).toHaveCount(1)
      await expect(code).toContainText("function hello()")
      await expect(code).toContainText("return true")

      const outerParagraphs = content.locator(":scope > p:not(.provisional-paragraph)")
      await expect(outerParagraphs).toHaveCount(0)
    })
  })
})
