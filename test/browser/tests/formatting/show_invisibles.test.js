import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

const SHOW_INVISIBLES_CLASS = "lexxy-editor__content--show-invisibles"

function button(page) {
  return page.locator("lexxy-toolbar button[name='show-invisibles']")
}

async function pseudoContent(locator, pseudo) {
  return locator.evaluate(
    (el, pseudo) => window.getComputedStyle(el, pseudo).content,
    pseudo,
  )
}

test.describe("Show invisibles", () => {
  test("the toolbar button is absent unless the option is enabled", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-toolbar[connected]")

    await expect(button(page)).toHaveCount(0)
  })

  test.describe("when enabled", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/show-invisibles.html")
      await page.waitForSelector("lexxy-toolbar[connected]")
    })

    test("the toolbar button appears", async ({ page }) => {
      await expect(button(page)).toBeVisible()
    })

    test("marks are hidden until the button is toggled on", async ({ page, editor }) => {
      await expect(button(page)).toHaveAttribute("aria-pressed", "false")
      await expect(editor.content).not.toHaveClass(new RegExp(SHOW_INVISIBLES_CLASS))

      await button(page).click()

      await expect(button(page)).toHaveAttribute("aria-pressed", "true")
      await expect(editor.content).toHaveClass(new RegExp(SHOW_INVISIBLES_CLASS))

      await button(page).click()

      await expect(button(page)).toHaveAttribute("aria-pressed", "false")
      await expect(editor.content).not.toHaveClass(new RegExp(SHOW_INVISIBLES_CLASS))
    })

    test("a soft return is rendered as a markable element but serialized as a plain <br>", async ({ page, editor }) => {
      await editor.send("Hello", "Shift+Enter", "World")

      await assertEditorHtml(editor, "<p>Hello<br>World</p>")
      await expect(editor.content.locator("span.lexxy-line-break")).toHaveCount(1)
    })

    test("consecutive soft returns each render a markable element", async ({ page, editor }) => {
      await editor.send("Hello", "Shift+Enter", "Shift+Enter", "World")

      await assertEditorHtml(editor, "<p>Hello<br><br>World</p>")
      await expect(editor.content.locator("span.lexxy-line-break")).toHaveCount(2)
    })

    test("an empty paragraph placeholder is not a markable soft return", async ({ page, editor }) => {
      await editor.send("Hello", "Enter", "Enter", "World")

      await assertEditorHtml(editor, "<p>Hello</p><p><br></p><p>World</p>")
      await expect(editor.content.locator("span.lexxy-line-break")).toHaveCount(0)
    })

    test("shows the return glyph on soft returns when toggled on", async ({ page, editor }) => {
      await editor.send("Hello", "Shift+Enter", "World")
      const softReturn = editor.content.locator("span.lexxy-line-break").first()

      expect(await pseudoContent(softReturn, "::before")).toBe("none")

      await button(page).click()

      expect(await pseudoContent(softReturn, "::before")).toBe('"↵"')
    })

    test("shows the pilcrow glyph at paragraph ends when toggled on", async ({ page, editor }) => {
      await editor.send("Hello")
      const paragraph = editor.content.locator("p").first()

      expect(await pseudoContent(paragraph, "::after")).toBe("none")

      await button(page).click()

      expect(await pseudoContent(paragraph, "::after")).toBe('"¶"')
    })

    test("marks never leak into the serialized value", async ({ page, editor }) => {
      await button(page).click()
      await editor.send("Hello", "Shift+Enter", "World")

      await assertEditorHtml(editor, "<p>Hello<br>World</p>")
    })

    test("a soft return loaded from saved HTML round-trips unchanged", async ({ page, editor }) => {
      await editor.setValue("<p>Hello<br>World</p>")

      await expect(editor.content.locator("span.lexxy-line-break")).toHaveCount(1)
      await assertEditorHtml(editor, "<p>Hello<br>World</p>")
    })

    test("backspace removes a soft return", async ({ page, editor }) => {
      await editor.send("Hello", "Shift+Enter", "World")
      await editor.send("ArrowLeft", "ArrowLeft", "ArrowLeft", "ArrowLeft", "ArrowLeft", "Backspace")

      await assertEditorHtml(editor, "<p>HelloWorld</p>")
      await expect(editor.content.locator("span.lexxy-line-break")).toHaveCount(0)
    })

    test("forward delete removes a soft return", async ({ page, editor }) => {
      await editor.send("Hello", "Shift+Enter", "World")
      await editor.send("ArrowLeft", "ArrowLeft", "ArrowLeft", "ArrowLeft", "ArrowLeft", "ArrowLeft", "Delete")

      await assertEditorHtml(editor, "<p>HelloWorld</p>")
      await expect(editor.content.locator("span.lexxy-line-break")).toHaveCount(0)
    })

    test("a selection spanning a soft return can be replaced", async ({ page, editor }) => {
      await editor.send("Hello", "Shift+Enter", "World")
      await editor.selectAll()
      await editor.send("Bye")

      await assertEditorHtml(editor, "<p>Bye</p>")
      await expect(editor.content.locator("span.lexxy-line-break")).toHaveCount(0)
    })

    test("toggling and editing raises no console errors", async ({ page, editor }) => {
      startMonitoringConsole(page)

      await button(page).click()
      await editor.send("Hello", "Shift+Enter", "World", "Enter", "Again")
      await button(page).click()

      await assertEditorHtml(editor, "<p>Hello<br>World</p><p>Again</p>")
      expect(page).toHaveNoErrors()
    })
  })
})
