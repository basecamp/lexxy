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
      page.locator("lexxy-toolbar button[name=upload]"),
    ).toBeVisible()

    await page.goto("/attachments-disabled.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=upload]"),
    ).toBeHidden()

    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=upload]"),
    ).toBeVisible()

    await page.goto("/")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=upload]"),
    ).toBeVisible()

    await page.goto("/attachments-invalid.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await expect(
      page.locator("lexxy-toolbar button[name=upload]"),
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

  test("external toolbar", async ({ page }) => {
    await page.goto("/toolbar-external.html")
    await expect(
      page.locator("lexxy-toolbar#external_toolbar[connected]"),
    ).toBeVisible()
  })
})
