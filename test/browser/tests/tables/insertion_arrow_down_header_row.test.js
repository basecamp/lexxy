import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Inserting a table from the keyboard toolbar, then Tab back", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.content.click()
  })

  test("ArrowDown from the line above lands in the header row", async ({ page, editor }) => {
    await page.keyboard.type("Before the table")
    await insertTableFromKeyboardAndReturn(page, editor)

    await page.keyboard.press("ArrowDown")
    await page.keyboard.type("A1")

    await expect(editor.content.locator("table tr").nth(0).locator("th, td").nth(0)).toHaveText("A1")
    await expect(editor.content.locator("table tr").nth(1)).not.toContainText("A1")
  })

  test("typing keeps the format of the line above", async ({ page, editor }) => {
    await page.keyboard.press("ControlOrMeta+b")
    await page.keyboard.type("Bold line")
    await insertTableFromKeyboardAndReturn(page, editor)

    await page.keyboard.type(" continues")

    // Where the caret lands differs: WebKit puts it at the start of the line on Tab back
    await expect(editor.content.locator("p strong")).toContainText("continues")
    await expect(editor.content.locator("p strong")).toContainText("Bold line")
    await expect(editor.content.locator("table")).not.toContainText("continues")
  })

  for (const [ direction, selectWord ] of [
    [ "forward", async (page) => {
      for (let index = 0; index < 5; index++) await page.keyboard.press("ArrowLeft")
      for (let index = 0; index < 5; index++) await page.keyboard.press("Shift+ArrowRight")
    } ],
    [ "backward", async (page) => {
      for (let index = 0; index < 5; index++) await page.keyboard.press("Shift+ArrowLeft")
    } ]
  ]) {
    test(`a ${direction} selection inside a line inserts without an invalid selection`, async ({ page, editor }) => {
      const errors = []
      page.on("pageerror", error => errors.push(error.message))
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()) })

      await page.keyboard.type("Hello world")
      await selectWord(page)
      await insertTableFromKeyboardAndReturn(page, editor)
      await editor.flush()

      expect(errors.filter(error => /offset/i.test(error))).toEqual([])
    })
  }
})

async function insertTableFromKeyboardAndReturn(page, editor) {
  await page.keyboard.press("Shift+Tab")

  const tableButton = page.locator("lexxy-toolbar button[data-command='insertTable']")
  for (let index = 0; index < 20 && !(await tableButton.evaluate(element => element === document.activeElement)); index++) {
    await page.keyboard.press("ArrowRight")
  }
  await expect(tableButton).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(editor.content.locator("table")).toHaveCount(1)
  await page.keyboard.press("Tab")
  await expect(editor.content).toBeFocused()
}
