import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../helpers/assertions.js"

test.describe("Horizontal divider", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/new")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("insert horizontal divider via toolbar", async ({ page, editor }) => {
    await editor.send("Some text before")

    await page.getByRole("button", { name: "Insert a divider" }).click()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("figure.horizontal-divider")).toBeVisible()
      await expect(
        content.locator("figure.horizontal-divider hr"),
      ).toBeVisible()
    })

    await editor.send("Some text after")

    await assertEditorHtml(
      editor,
      "<p>Some text before</p><hr><p>Some text after</p>",
    )
  })

  test("delete horizontal divider with keyboard", async ({ page, editor }) => {
    await editor.send("Text before")
    await page.getByRole("button", { name: "Insert a divider" }).click()
    await editor.send("Text after")

    await editor.content
      .locator("figure.horizontal-divider")
      .click()

    await page.keyboard.press("Delete")

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator("figure.horizontal-divider"),
      ).toHaveCount(0)
    })
    await assertEditorHtml(editor, "<p>Text before</p><p>Text after</p>")
  })

  test("delete horizontal divider with the delete button", async ({
    page,
    editor,
  }) => {
    await editor.send("Text before")
    await page.getByRole("button", { name: "Insert a divider" }).click()
    await editor.send("Text after")

    await editor.content
      .locator("figure.horizontal-divider")
      .click()

    await expect(
      editor.locator.locator("lexxy-node-delete-button"),
    ).toBeVisible()
    await editor.locator
      .locator("lexxy-node-delete-button button[aria-label='Remove']")
      .click()

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator("figure.horizontal-divider"),
      ).toHaveCount(0)
    })
    await assertEditorHtml(editor, "<p>Text before</p><p>Text after</p>")
  })

  test("horizontal divider with surrounding content", async ({
    page,
    editor,
  }) => {
    await editor.send("Before divider")
    await page.getByRole("button", { name: "Insert a divider" }).click()
    await editor.send("After divider")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("figure.horizontal-divider hr")).toBeVisible()
    })

    await assertEditorHtml(
      editor,
      "<p>Before divider</p><hr><p>After divider</p>",
    )
  })
})
