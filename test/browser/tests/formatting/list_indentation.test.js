import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("List indentation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("Tab key indents bullet list item", async ({ editor }) => {
    await editor.setValue(
      "<ul><li>First item</li><li>Second item</li></ul>",
    )
    await editor.select("Second item")
    await editor.sendTab()

    await assertEditorHtml(
      editor,
      '<ul><li value="1">First item</li><li value="2" class="lexxy-nested-listitem"><ul><li value="1">Second item</li></ul></li></ul>',
    )
  })

  test("multiple Tab presses create deeper nesting in bullet list", async ({
    editor,
  }) => {
    await editor.setValue("<ul><li>First</li><li>Second</li></ul>")
    await editor.select("Second")

    await editor.sendTab()
    await editor.sendTab()

    await assertEditorHtml(
      editor,
      '<ul><li value="1">First</li><li value="2" class="lexxy-nested-listitem"><ul><li value="1" class="lexxy-nested-listitem"><ul><li value="1">Second</li></ul></li></ul></li></ul>',
    )
  })

  test("Tab and Shift+Tab can indent and outdent multiple times in bullet list", async ({
    editor,
  }) => {
    await editor.setValue("<ul><li>First</li><li>Second</li></ul>")
    await editor.select("Second")

    await editor.sendTab()
    await editor.sendTab()
    await editor.sendTab({ shift: true })

    await assertEditorHtml(
      editor,
      '<ul><li value="1">First</li><li value="2" class="lexxy-nested-listitem"><ul><li value="1">Second</li></ul></li></ul>',
    )
  })

  test("Shift+Tab outdents bullet list item", async ({ editor }) => {
    await editor.setValue(
      '<ul><li>First item</li><li class="lexxy-nested-listitem"><ul><li>Nested item</li></ul></li></ul>',
    )
    await editor.select("Nested item")

    await editor.sendTab({ shift: true })

    await assertEditorHtml(
      editor,
      '<ul><li value="1">First item</li><li value="2">Nested item</li></ul>',
    )
  })

  test("Tab key indents numbered list item", async ({ editor }) => {
    await editor.setValue(
      "<ol><li>First item</li><li>Second item</li></ol>",
    )
    await editor.select("Second item")
    await editor.sendTab()

    await assertEditorHtml(
      editor,
      '<ol><li value="1">First item</li><li value="2" class="lexxy-nested-listitem"><ol><li value="1">Second item</li></ol></li></ol>',
    )
  })

  test("Shift+Tab outdents numbered list item", async ({ editor }) => {
    await editor.setValue(
      '<ol><li>First item</li><li class="lexxy-nested-listitem"><ol><li>Nested item</li></ol></li></ol>',
    )
    await editor.select("Nested item")

    await editor.sendTab({ shift: true })

    await assertEditorHtml(
      editor,
      '<ol><li value="1">First item</li><li value="2">Nested item</li></ol>',
    )
  })

  test("Tab key does nothing when not inside a list", async ({ editor }) => {
    await editor.setValue("<p>Regular paragraph</p>")
    await editor.select("Regular")

    const initialValue = await editor.value()
    await editor.sendTab()

    await assertEditorHtml(editor, initialValue)
  })
})
