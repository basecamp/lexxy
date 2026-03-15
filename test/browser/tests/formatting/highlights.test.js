import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { HELLO_EVERYONE, applyHighlightOption } from "../../helpers/toolbar.js"

test.describe("Highlights", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
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
})
