import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Lexical's HTML export carries markers Lexxy doesn't store: block indentation and a marked
// <br> after a block's trailing line break. The value drops them, but never text that reads
// the same.
test.describe("Editor value export cleanup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("keep typed text that reads like the indentation attribute", async ({ editor }) => {
    await editor.setValue("")
    await editor.click()
    await editor.send(...'Explain data-lexical-indent="2" here'.split(""))

    expect(await editor.value()).toBe('<p>Explain data-lexical-indent="2" here</p>')
  })

  test("keep code that mentions the indentation attribute", async ({ editor }) => {
    await editor.setValue('<pre data-language="html">&lt;p data-lexical-indent="1"&gt;x&lt;/p&gt;</pre>')
    await editor.flush()

    expect(await editor.value()).toContain('&lt;p data-lexical-indent="1"&gt;x&lt;/p&gt;')
  })

  test("drop block indentation from the value", async ({ editor }) => {
    await editor.setValue('<p data-lexical-indent="2">Indented</p>')
    await editor.flush()

    expect(await editor.value()).toBe("<p>Indented</p>")
  })

  test("drop the marked line break after a paragraph's trailing Shift+Enter", async ({ editor }) => {
    await editor.setValue("<p>First</p>")
    await editor.flush()

    await editor.placeCaretInside("First", "First".length)
    await editor.send("Shift+Enter")

    expect(await editor.value()).toBe("<p>First<br></p>")
  })
})
