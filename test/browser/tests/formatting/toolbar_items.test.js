import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { EditorHandle } from "../../helpers/editor_handle.js"

function toolbarItemNames(page, editorSelector) {
  return page.locator(`${editorSelector} lexxy-toolbar`).evaluate((toolbar) => {
    return Array.from(toolbar.children)
      .filter((item) => !item.classList.contains("lexxy-editor__toolbar-overflow"))
      .map((item) => item.matches("button") ? item.name : item.querySelector(":scope > [data-dropdown-trigger]").name)
  })
}

test.describe("Toolbar items", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toolbar-items.html")
    await page.waitForSelector("#images-only lexxy-toolbar[connected]")
  })

  test("a preset sets which items the toolbar shows, and in what order", async ({ page }) => {
    expect(await toolbarItemNames(page, "#compact")).toEqual([ "bold", "italic", "insert", "link", "undo", "redo" ])
    await expect(page.locator("#compact lexxy-toolbar button[name=image]")).toHaveCount(0)
    await expect(page.locator("#compact lexxy-toolbar button[name=italic]")).toHaveClass(/lexxy-editor__toolbar-group-end/)
    await expect(page.locator("#compact lexxy-toolbar button[name=undo]")).toHaveClass(/lexxy-editor__toolbar-button--push-right/)
  })

  test("the toolbar attribute overrides the preset's items", async ({ page }) => {
    expect(await toolbarItemNames(page, "#override")).toEqual([ "italic", "redo" ])
  })

  test("a dropdown group runs the commands of its items", async ({ page }) => {
    const editor = new EditorHandle(page, "#compact")
    await editor.waitForConnected()
    await editor.click()

    const toolbar = page.locator("#compact lexxy-toolbar")
    await toolbar.locator("button[name=insert]").click()
    await expect(toolbar.getByRole("menu", { name: "Insert" })).toBeVisible()

    await toolbar.getByRole("menuitem", { name: "Insert a table" }).click()
    await expect(editor.content.locator("table")).toHaveCount(1)
    await expect(toolbar.getByRole("menu", { name: "Insert" })).toBeHidden()
  })

  test("a dropdown group shows as pressed while one of its items is", async ({ page }) => {
    const editor = new EditorHandle(page, "#compact")
    await editor.waitForConnected()
    await editor.setValue("<p>Hello <s>everyone</s></p>")

    const trigger = page.locator("#compact lexxy-toolbar button[name=insert]")

    await editor.select("Hello")
    await expect(trigger).toHaveAttribute("aria-pressed", "false")

    await editor.select("everyone")
    await expect(trigger).toHaveAttribute("aria-pressed", "true")
  })

  test("a disabled feature stays hidden even when its items are configured", async ({ page }) => {
    const toolbar = page.locator("#attachments-disabled lexxy-toolbar")

    await expect(toolbar.locator("button[name=image]")).toBeHidden()
    await expect(toolbar.locator("button[name=file]")).toBeHidden()
    await expect(toolbar.locator("button[name=bold]")).toBeVisible()
  })

  test("the upload option still picks the upload buttons", async ({ page }) => {
    const toolbar = page.locator("#images-only lexxy-toolbar")

    await expect(toolbar.locator("button[name=image]")).toBeVisible()
    await expect(toolbar.locator("button[name=file]")).toBeHidden()
  })
})
