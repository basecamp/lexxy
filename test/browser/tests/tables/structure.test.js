import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorTableStructure } from "../../helpers/assertions.js"

test.describe("Tables — Structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("adding a table", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await assertEditorTableStructure(editor, 3, 3)
  })

  test("writing in table fields", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await editor.send("Test Cell")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table th").first()).toContainText(
        "Test Cell",
      )
    })
  })

  test("adding a new row", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await editor.clickTableButton("Add row")
    await assertEditorTableStructure(editor, 3, 4)
  })

  test("deleting a row", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")

    await expect(editor.content.locator("table tr")).toHaveCount(3)

    await editor.clickTableButton("Remove row")

    await expect(editor.content.locator("table tr")).toHaveCount(2)
  })

  test("adding a new column", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await assertEditorTableStructure(editor, 3, 3)

    await editor.clickTableButton("Add column")
    await assertEditorTableStructure(editor, 4, 3)
  })

  test("deleting a column", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")
    await assertEditorTableStructure(editor, 3, 3)

    await editor.clickTableButton("Remove column")
    await assertEditorTableStructure(editor, 2, 3)
  })
})
