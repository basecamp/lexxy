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
})
