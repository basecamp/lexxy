import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Bug: Editing code block with highlights throws error", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("pressing Enter in a re-imported code block with highlights does not throw", async ({ page, editor }) => {
    // Simulate the saved HTML from a code block with "asdf " where "df" is highlighted.
    // This is what Action Text would persist and re-load when editing a comment.
    const savedHTML = '<pre data-language="plain"><code>as<mark style="background-color: rgb(255, 218, 185);">df</mark> </code></pre>'

    await editor.setValue(savedHTML)

    // Wait for the highlight to be applied after retokenization
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    // Collect uncaught page errors
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    // Place cursor after the trailing space (end of the code block content)
    await editor.content.evaluate((content) => {
      const code = content.querySelector("code")
      const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
      let lastTextNode = null
      let node
      while ((node = walker.nextNode())) {
        lastTextNode = node
      }
      if (lastTextNode) {
        const range = document.createRange()
        range.setStart(lastTextNode, lastTextNode.textContent.length)
        range.collapse(true)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      }
    })
    await editor.flush()

    // Press Enter twice to trigger the early-escape behavior.
    // The first Enter inserts a LineBreakNode, the second triggers the
    // empty-last-line escape (paragraph after the code block).
    // Without the fix, the retokenizer creates a stale element-type
    // selection offset that causes a splice error on the second Enter.
    await editor.send("Enter", "Enter")

    // Allow any async error handlers to fire
    await page.waitForTimeout(100)

    // Should have no errors
    expect(errors).toEqual([])

    // Editor should still be functional — typing should work
    await editor.send("hello")
    const text = await editor.plainTextValue()
    expect(text).toContain("hello")
  })

  test("highlights survive after editing a re-imported code block", async ({ editor }) => {
    const savedHTML = '<pre data-language="plain"><code>as<mark style="background-color: var(--highlight-bg-1);">df</mark> </code></pre>'

    await editor.setValue(savedHTML)

    // Wait for the highlight to be applied after retokenization
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    // Verify the highlighted text content
    await expect(editor.content.locator("code mark")).toHaveText("df")

    // Place cursor at the start of the code block and type
    await editor.content.locator("code").click()
    await editor.send("Home")
    await editor.send("x")
    await editor.flush()

    // Wait for retokenization to complete after the edit, then assert
    // that the highlight mark element is still present
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    await expect(editor.content.locator("code mark")).toHaveText("df")
  })

  test("typing after a highlight on the same line preserves it", async ({ editor }) => {
    const savedHTML = '<pre data-language="plain"><code>as<mark style="background-color: var(--highlight-bg-1);">df</mark> </code></pre>'

    await editor.setValue(savedHTML)

    // Wait for the highlight to be applied after retokenization
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    await expect(editor.content.locator("code mark")).toHaveText("df")

    // Place cursor at the end of the line (after the trailing space)
    await editor.content.locator("code").click()
    await editor.send("End")
    await editor.send("xyz")
    await editor.flush()

    // Wait for retokenization to complete after the edit, then assert
    // that the highlight mark element is still present
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    await expect(editor.content.locator("code mark")).toHaveText("df")
  })

  test("pressing Enter to create a new line below a highlight preserves it", async ({ editor }) => {
    const savedHTML = '<pre data-language="plain"><code>as<mark style="background-color: var(--highlight-bg-1);">df</mark> </code></pre>'

    await editor.setValue(savedHTML)

    // Wait for the highlight to be applied after retokenization
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    await expect(editor.content.locator("code mark")).toHaveText("df")

    // Place cursor at the end of the line (after the trailing space)
    await editor.content.locator("code").click()
    await editor.send("End")

    // Press Enter to create a new line below the highlighted region
    await editor.send("Enter")
    await editor.flush()

    // Type text on the new line
    await editor.send("xyz")
    await editor.flush()

    // Wait for retokenization to complete after the edit, then assert
    // that the highlight mark element is still present on the original line
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    await expect(editor.content.locator("code mark")).toHaveText("df")
  })

  test("cursor stays on new line after pressing Enter in re-imported code block with highlights", async ({ page, editor }) => {
    // Multi-line code block with a highlight on the first line
    const savedHTML = '<pre data-language="plain"><code>hello <mark style="background-color: var(--highlight-bg-1);">world</mark>\nfoo bar</code></pre>'

    await editor.setValue(savedHTML)

    // Wait for the highlight to be applied after retokenization
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    // Place cursor at the end of the first line (after "world")
    await editor.content.locator("code").click()
    await editor.send("Home")
    await editor.send("End")
    await editor.flush()

    // Press Enter to insert a new line
    await editor.send("Enter")
    await editor.flush()

    // Wait for any async re-application cycles to settle
    await page.waitForTimeout(200)
    await editor.flush()

    // Type text — it should appear on the new line, NOT on the first line
    await editor.send("NEW")
    await editor.flush()

    // Wait for retokenization to settle
    await page.waitForTimeout(200)
    await editor.flush()

    // Read debug info
    const debugInfo = await page.evaluate(() => window.__hlDebug || [])
    console.log("Debug info:", JSON.stringify(debugInfo, null, 2))

    const plainText = await editor.plainTextValue()
    console.log("Plain text:", JSON.stringify(plainText))
    // "hello world" and "NEW" should be on separate lines.
    // If the cursor jumped back, "NEW" would be on the same line as "hello world".
    expect(plainText).toMatch(/world\n+NEW/)
  })
})
