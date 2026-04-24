import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

test.describe("Code block navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("pressing Enter at start of code block inserts paragraph before it", async ({ editor }) => {
    await editor.setValue("<pre><code>some code</code></pre>")

    // Click directly on the code block text to place cursor inside it
    await editor.content.locator("code").click()
    await editor.flush()

    // Move to the very beginning of the code block
    await editor.send("Home")
    await editor.flush()

    // Press Enter at start to create paragraph before code block
    await editor.send("Enter")
    await editor.flush()

    // ArrowUp moves to the new paragraph above
    await editor.send("ArrowUp")
    await editor.send("text before code")

    await assertEditorContent(editor, async (content) => {
      const paragraphs = content.locator("p:not(.provisional-paragraph)")
      await expect(paragraphs).toHaveCount(1)
      await expect(paragraphs.first()).toContainText("text before code")
      await expect(content.locator("code")).toContainText("some code")
    })
  })

  test("pressing Enter twice exits code block when last line contains only whitespace", async ({ editor }) => {
    // Create a code block and type content with a whitespace-only last line
    await editor.click()
    await editor.send("```")
    await editor.send("Enter")
    await editor.flush()

    // Type some content, then a new line with only spaces
    await editor.send("hello")
    await editor.send("Enter")
    await editor.send("   ")
    await editor.flush()

    // First Enter: clears the whitespace-only line, cursor lands on an empty last line
    await editor.send("Enter")
    await editor.flush()

    // Still inside the code block — no paragraphs should exist at all
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toContainText("hello")
      await expect(content.locator("p:not(.provisional-paragraph)")).toHaveCount(0)
    })

    // Second Enter: cursor is on an empty last line, so it escapes the code block
    await editor.send("Enter")
    await editor.flush()

    await editor.send("outside text")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toContainText("hello")
      await expect(content.locator("code")).not.toContainText("outside text")
      await expect(content.locator("p").filter({ hasText: "outside text" })).toHaveCount(1)
    })
  })

  test("code block content is preserved after inserting paragraph before it", async ({ editor }) => {
    await editor.setValue("<pre><code>line one\nline two</code></pre>")

    await editor.content.locator("code").click()
    await editor.flush()

    await editor.send("Home")
    await editor.flush()

    await editor.send("Enter")
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toContainText("line one")
      await expect(content.locator("code")).toContainText("line two")
    })
  })
})
