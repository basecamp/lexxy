import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { HELLO_EVERYONE } from "../../helpers/toolbar.js"

test.describe("Toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("disable toolbar", async ({ page }) => {
    await expect(page.locator("lexxy-toolbar")).toBeVisible()

    await page.goto("/toolbar-disabled.html")
    await expect(page.locator("lexxy-toolbar")).toHaveCount(0)
  })

  test("attachments icon display", async ({ page }) => {
    await expect(
      page.locator("lexxy-toolbar button[name=image]"),
    ).toBeVisible()

    await page.goto("/attachments-disabled.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=image]"),
    ).toBeHidden()

    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=image]"),
    ).toBeVisible()

    await page.goto("/")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=image]"),
    ).toBeVisible()

    await page.goto("/attachments-invalid.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=image]"),
    ).toBeVisible()
  })

  test("keyboard navigation in toolbar", async ({ page, editor }) => {
    await editor.setValue(HELLO_EVERYONE)

    const boldButton = page.locator("lexxy-toolbar button[name='bold']")
    await boldButton.focus()

    const focusedName = () =>
      page.evaluate(() => document.activeElement?.getAttribute("name"))

    await expect.poll(focusedName).toBe("bold")

    await page.keyboard.press("ArrowRight")
    await expect.poll(focusedName).toBe("italic")

    await page.keyboard.press("ArrowLeft")
    await expect.poll(focusedName).toBe("bold")
  })

  test("undo and redo commands", async ({ page, editor }) => {
    await editor.send("Hello World")
    await assertEditorHtml(editor, "<p>Hello World</p>")

    // Undo until the undo button is disabled (editor is back to initial state)
    const undoButton = page.getByRole("button", { name: "Undo" })
    while (await undoButton.evaluate((el) => !el.disabled)) {
      await undoButton.click()
      await editor.flush()
    }
    await assertEditorHtml(editor, "<p><br></p>")

    // Redo until the redo button is disabled
    const redoButton = page.getByRole("button", { name: "Redo" })
    while (await redoButton.evaluate((el) => !el.disabled)) {
      await redoButton.click()
      await editor.flush()
    }
    await assertEditorHtml(editor, "<p>Hello World</p>")
  })

  test("overflow compaction keeps upload button visible", async ({ page }) => {
    const toolbar = page.locator("lexxy-toolbar")
    const uploadButton = toolbar.locator(":scope > button[name=image]")
    const overflowMenu = toolbar.locator(".lexxy-editor__toolbar-overflow-menu")

    // Shrink the viewport until the toolbar overflows
    const originalSize = page.viewportSize()
    await page.setViewportSize({ width: 300, height: originalSize.height })

    // Wait for the toolbar to enter overflow state
    await expect(toolbar).toHaveAttribute("overflowing", "")

    // The upload button must remain a direct child of the toolbar (not moved to overflow menu)
    await expect(uploadButton).toBeVisible()
    await expect(uploadButton).toHaveCount(1)

    // Other buttons should have been moved into the overflow menu
    const overflowedButtons = overflowMenu.locator("button")
    await expect(overflowedButtons.first()).toBeAttached()

    // The upload button must not appear inside the overflow menu
    await expect(overflowMenu.locator("button[name=image]")).toHaveCount(0)

    // Upload button should be clickable (not obscured)
    await expect(uploadButton).toBeEnabled()

    // Restore viewport and verify overflow is resolved
    await page.setViewportSize(originalSize)
    await expect(toolbar).not.toHaveAttribute("overflowing")
  })

  test("image button opens file picker restricted to images and videos", async ({ page }) => {
    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.locator("lexxy-toolbar button[name='image']").click(),
    ])

    // The file input created by the image button should only accept images and videos
    const accept = await page.locator("lexxy-editor input[type='file']").getAttribute("accept")
    expect(accept).toBe("image/*,video/*")
  })

  test("file button opens file picker with no type restriction", async ({ page }) => {
    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.locator("lexxy-toolbar button[name='file']").click(),
    ])

    // The file input created by the file button should accept all file types
    const accept = await page.locator("lexxy-editor input[type='file']").getAttribute("accept")
    expect(accept).toBeNull()
  })

  test("external toolbar", async ({ page }) => {
    await page.goto("/toolbar-external.html")
    await expect(
      page.locator("lexxy-toolbar#external_toolbar[connected]"),
    ).toBeVisible()
  })
})
