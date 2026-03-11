import { test } from "../test_helper.js"
import { assertEditorHtml } from "../helpers/assertions.js"

test.describe("Color highlighter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/new")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("color highlighting collapsed selection", async ({ page, editor }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("everyone")
    await editor.send("ArrowRight")

    await applyHighlightOption(page, "color", 1)
    await editor.send(" again!")

    await assertEditorHtml(
      editor,
      '<p>Hello everyone<mark style="color: var(--highlight-1);"> again!</mark></p>',
    )
  })
})

async function applyHighlightOption(page, attribute, buttonIndex) {
  await page.locator("[name='highlight']").click()
  const buttons = page.locator(
    `lexxy-highlight-dropdown .lexxy-highlight-colors .lexxy-highlight-button[data-style='${attribute}']`,
  )
  await buttons.nth(buttonIndex - 1).click()
}
