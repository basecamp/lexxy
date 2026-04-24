import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Paste — Code block copy preserves newlines", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("pasting a highlighted code block preserves newlines", async ({
    page,
    editor,
  }) => {
    await editor.click()

    // After highlightCode() runs on a rendered view, the stored <pre> is
    // replaced with <pre><code data-language="...">…highlighted…</code></pre>.
    // The <pre> wrapper preserves whitespace so that literal \n characters in
    // the text survive the browser's copy-to-clipboard serialization.
    //
    // Simulate pasting this highlighted HTML into the editor.
    const html = '<pre><code data-language="ruby">' +
      '<span class="token keyword">set</span> vlans 100\n' +
      '<span class="token keyword">set</span> vlans 200\n' +
      '<span class="token keyword">set</span> interfaces ge-0/0/1</code></pre>'

    await editor.paste(
      "set vlans 100\nset vlans 200\nset interfaces ge-0/0/1",
      { html },
    )
    await editor.flush()

    const plainText = await editor.plainTextValue()
    expect(plainText).toContain("set vlans 100\nset vlans 200\nset interfaces ge-0/0/1")
  })
})
