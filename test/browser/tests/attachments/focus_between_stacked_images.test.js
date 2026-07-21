import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const IMG = '<action-text-attachment content-type="image/png" url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" filename="test.png" filesize="1024" width="200" height="120"></action-text-attachment>'

// #1147: a caret between two stacked block images leaves a leading and trailing
// provisional paragraph in place. A selectionchange anywhere on the page marks
// those dirty, and the resulting reconcile writes the editor's selection back to
// the DOM — pulling focus into the editor and away from wherever the user is
// actually typing.
test.describe("Focus stays put with a caret between stacked images (#1147)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-enabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await placeCaretBetweenStackedImages(page)
  })

  test("a selection change elsewhere on the page does not pull focus back into the editor", async ({ page, editor }) => {
    const input = page.locator("input[name='post[title]']")
    await input.click()
    await expect(input).toBeFocused()

    // Firefox 152 fires selectionchange for an outside input's caret; Blink and
    // older Gecko do not. Replay that signal directly so the regression is covered
    // on every browser — without the guard it drives a focus-stealing reconcile.
    await dispatchSelectionChange(page)

    await expect(input).toBeFocused()
  })

  test("typing in an outside input keeps the caret in that input", async ({ page }) => {
    const input = page.locator("input[name='post[title]']")
    await input.click()
    await input.pressSequentially("hello")

    await expect(input).toBeFocused()
    await expect(input).toHaveValue("hello")
  })
})

async function placeCaretBetweenStackedImages(page) {
  const editor = page.locator("lexxy-editor")
  await editor.evaluate((el, html) => (el.value = html), IMG + IMG)
  await editor.locator(".lexxy-editor__content").evaluate((content) => {
    const between = [ ...content.children ].find((child, index) =>
      child.classList.contains("provisional-paragraph") && content.children[index - 1]?.tagName === "FIGURE")
    const range = document.createRange()
    range.selectNodeContents(between)
    range.collapse(true)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  })
  await page.locator("lexxy-editor").locator(".lexxy-editor__content").press("x")
}

async function dispatchSelectionChange(page) {
  const dispatched = await page.locator("lexxy-editor").evaluate((el) => {
    const command = [ ...el.editor._commands.keys() ].find((candidate) => candidate?.type === "SELECTION_CHANGE_COMMAND")
    if (!command) return false
    el.editor.dispatchCommand(command, undefined)
    return true
  })
  expect(dispatched, "SELECTION_CHANGE_COMMAND must be resolvable for this regression to have teeth").toBe(true)
}
