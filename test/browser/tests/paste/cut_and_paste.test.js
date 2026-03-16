import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

const modifier = process.platform === "darwin" ? "Meta" : "Control"

test.describe("Paste — Cut and paste", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("cut and paste does not duplicate content", async ({ editor }) => {
    await editor.send("Hello world")
    await editor.flush()

    await editor.selectAll()
    await editor.content.press(`${modifier}+x`)
    await editor.flush()

    await editor.content.press(`${modifier}+v`)
    await editor.flush()

    await assertEditorHtml(editor, "<p>Hello world</p>")
  })
})
