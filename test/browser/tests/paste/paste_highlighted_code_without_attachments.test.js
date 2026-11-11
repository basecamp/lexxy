import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Pasted HTML goes through the editor's own import whether or not attachments are
// enabled. A rendered, highlighted code block holds its saved trailing <br> as a
// newline, and only that import drops it again.
test.describe("Paste into an editor with attachments disabled", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments-false.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("a highlighted code block pasted back keeps its blank lines", async ({ editor }) => {
    await editor.setValue('<pre data-language="ruby">x = 1<br><br></pre>')
    await editor.flush()
    const saved = await editor.value()

    await editor.setValue("")
    await editor.flush()
    await editor.paste("x = 1\n\n", {
      html: '<pre data-language="ruby" data-highlight-language="ruby" data-highlighted="true">x <span class="token operator">=</span> <span class="token number">1</span>\n\n</pre>',
    })

    expect(await editor.value()).toBe(saved)
  })
})
