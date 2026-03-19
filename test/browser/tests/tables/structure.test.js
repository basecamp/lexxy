import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorTableStructure } from "../../helpers/assertions.js"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

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

  test("deleting the table", async ({ editor }) => {
    await editor.clickToolbarButton("insertTable")

    await expect(editor.content.locator("table")).toBeVisible()

    await editor.clickTableButton("Delete this table?")

    await expect(editor.content.locator("table")).toHaveCount(0)
  })

  test("select all and delete when table is first child does not crash", async ({
    page,
    editor,
  }) => {
    const tableHtml = `<figure class="lexxy-content__table-wrapper"><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></figure><p>After table</p>`
    await editor.setValue(tableHtml)
    await editor.flush()

    await expect(editor.content.locator("table")).toHaveCount(1)

    // Place the cursor in the paragraph after the table
    await editor.click()
    await editor.select("After table")
    await editor.flush()

    // Listen for page errors (the bug threw: "Expected to find a parent TableCellNode")
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.selectAll()
    await editor.send("Backspace")
    await editor.flush()

    // Table should be removed without errors
    await expect(editor.content.locator("table")).toHaveCount(0)
    expect(errors.filter((e) => e.includes("#148"))).toHaveLength(0)
  })

  test("table is wrapped in figure.table-wrapper", async ({
    page,
    editor,
  }) => {
    await editor.clickToolbarButton("insertTable")
    await editor.flush()

    const value = await editor.value()
    // Parse the exported HTML in the browser to check structure
    const hasWrapper = await page.evaluate((html) => {
      const template = document.createElement("template")
      template.innerHTML = html
      const figure = template.content.querySelector(
        "figure.lexxy-content__table-wrapper",
      )
      return figure !== null && figure.querySelector("table") !== null
    }, value)
    expect(hasWrapper).toBe(true)
  })
})

test.describe("Tables with attachments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("uploading multiple images into a table cell at once", async ({
    page,
    editor,
  }) => {
    await editor.clickToolbarButton("insertTable")
    await editor.flush()

    await editor.content.locator("table th").first().click()
    await editor.flush()

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page
        .locator('lexxy-toolbar [name="upload"]')
        .click(),
    ])
    await fileChooser.setFiles([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    const cell = editor.content.locator("table th").first()
    await expect(
      cell.locator("figure.attachment"),
    ).toHaveCount(2, { timeout: 10_000 })
  })

  test("uploading images one by one into a table cell", async ({
    page,
    editor,
  }) => {
    await editor.clickToolbarButton("insertTable")
    await editor.flush()

    const cell = editor.content.locator("table td").first()
    await cell.click()
    await editor.flush()

    await editor.uploadFile("test/fixtures/files/example.png")
    await expect(
      cell.locator("figure.attachment"),
    ).toHaveCount(1, { timeout: 10_000 })

    // Upload second image without clicking the first
    await editor.uploadFile("test/fixtures/files/example2.png")

    // Both images should be inside the same table cell
    await expect(
      cell.locator("figure.attachment"),
    ).toHaveCount(2, { timeout: 10_000 })

    // No images should escape outside the table
    await expect(
      editor.content.locator(":scope > figure.attachment"),
    ).toHaveCount(0)
  })
})
