import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { clickToolbarButton } from "../../helpers/toolbar.js"

test.describe("Block format after a trailing line break", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")

    await editor.send("Hello")
    await editor.send("Shift+Enter")
  })

  test("numbered list starts on the new line", async ({ page, editor }) => {
    await page.getByRole("button", { name: "Numbered list" }).click()
    await assertEditorHtml(editor, '<p>Hello</p><ol><li value="1"></li></ol>')
  })

  test("bullet list starts on the new line", async ({ page, editor }) => {
    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, '<p>Hello</p><ul><li value="1"></li></ul>')
  })

  test("typing after creating the list goes into the new item", async ({ page, editor }) => {
    await page.getByRole("button", { name: "Bullet list" }).click()
    await editor.send("World")
    await assertEditorHtml(editor, '<p>Hello</p><ul><li value="1">World</li></ul>')
  })

  test("heading applies to the new line", async ({ page, editor }) => {
    await clickToolbarButton(page, "heading-large")
    await assertEditorHtml(editor, "<p>Hello</p><h2><br></h2>")
  })
})
