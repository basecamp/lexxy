import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Focus", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("focus the editor", async ({ editor }) => {
    await editor.focus()
    await expect(editor.content).toBeFocused()
  })

  test("text after focus doesn't add new line", async ({ editor }) => {
    await editor.focus()
    await editor.send("Hello there")

    await assertEditorHtml(editor, "<p>Hello there</p>")
  })

  test("autofocus attribute", async ({ page, editor }) => {
    await page.goto("/autofocus.html")
    await editor.waitForConnected()

    await expect(editor.content).toBeFocused()
  })

  test("focus() on a detached editor is a no-op", async ({ page }) => {
    const result = await page.evaluate(async () => {
      await customElements.whenDefined("lexxy-editor")

      const editor = document.createElement("lexxy-editor")

      try {
        editor.focus()
      } catch (error) {
        return { thrown: error.message }
      }

      const initialized = new Promise(resolve => editor.addEventListener("lexxy:initialize", resolve, { once: true }))
      document.body.append(editor)
      await initialized
      await new Promise(requestAnimationFrame)

      return { thrown: null, focused: editor.contains(document.activeElement) }
    })

    expect(result).toEqual({ thrown: null, focused: false })
  })

  test("focus() before the editor finishes initializing focuses it once ready", async ({ page }) => {
    await page.evaluate(() => {
      const editor = document.createElement("lexxy-editor")
      editor.id = "late-editor"
      document.body.append(editor)
      editor.focus()
    })

    await expect(page.locator("#late-editor .lexxy-editor__content")).toBeFocused()
  })
})
