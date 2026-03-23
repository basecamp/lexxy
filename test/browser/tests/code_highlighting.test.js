import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../helpers/assertions.js"

test.describe("Code highlighting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("ruby code is highlighted in editor", async ({ page, editor }) => {
    await editor.send("def hello_world")
    await editor.select("dev")
    await page.getByRole("button", { name: "Code" }).click()

    const languageSelect = page.locator("select[name=lexxy-code-language]")
    await expect(languageSelect).toHaveValue("plain")

    await languageSelect.selectOption("Ruby")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("span.code-token__attr")).toContainText(
        "def",
      )
    })
  })
})
