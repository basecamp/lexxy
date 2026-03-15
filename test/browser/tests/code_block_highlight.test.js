import { test } from "../test_helper.js"
import { assertEditorContent } from "../helpers/assertions.js"
import { expect } from "@playwright/test"

test.describe("Code block highlighting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("apply background-color highlight to text in a plain text code block", async ({ page, editor }) => {
    await editor.send("some code here")
    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    // Verify it's in plain text mode
    const languageSelect = page.locator("select[name=lexxy-code-language]")
    await expect(languageSelect).toHaveValue("plain")

    // Select "code" text inside the code block
    await editor.select("code")

    // Apply a background-color highlight
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    // Verify the highlight was applied inside the code block
    await assertEditorContent(editor, async (content) => {
      const highlighted = content.locator("code span[style*='background-color']")
      await expect(highlighted).toHaveCount(1)
      await expect(highlighted).toContainText("code")
    })
  })
})

async function applyHighlightOption(page, attribute, buttonIndex) {
  await page.locator("[name='highlight']").click()
  const buttons = page.locator(
    `lexxy-highlight-dropdown .lexxy-highlight-colors .lexxy-highlight-button[data-style='${attribute}']`,
  )
  await buttons.nth(buttonIndex - 1).click()
}
