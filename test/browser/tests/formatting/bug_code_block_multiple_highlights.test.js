import { test } from "../../test_helper.js"
import { applyHighlightOption } from "../../helpers/toolbar.js"
import { expect } from "@playwright/test"

test.describe("Bug: Code block allows only one highlight at a time", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("applying two highlights to different words in a code block preserves both", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>hello world goodbye</code></pre>')
    await expect(page.locator("select[name=lexxy-code-language]")).toHaveValue("plain")

    // Apply first highlight to "hello"
    await editor.select("hello")
    await applyHighlightOption(page, "background-color", 1)

    // Wait for first highlight to stabilize (retokenizer + reapplication cycle)
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
      await expect(editor.content.locator("code mark").first()).toContainText("hello")
    }).toPass({ timeout: 5_000 })

    // Apply second highlight to "goodbye"
    await editor.select("goodbye")
    await applyHighlightOption(page, "background-color", 2)

    // Both highlights should be present
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(2)
      await expect(editor.content.locator("code mark").nth(0)).toContainText("hello")
      await expect(editor.content.locator("code mark").nth(1)).toContainText("goodbye")
    }).toPass({ timeout: 5_000 })
  })
})
