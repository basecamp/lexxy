import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../helpers/assertions.js"

test.describe("Bug: Difficult to exit code blocks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("can exit code block by pressing Enter on empty last line", async ({ page, editor }) => {
    await editor.setValue("<pre><code>line one</code></pre>")
    await editor.click()

    // Move to end of the code content and press Enter twice to create an empty line then exit
    await editor.send("End")
    await editor.send("Enter")
    await editor.send("Enter")

    // After exiting, typing should go into a new paragraph below the code block
    await editor.send("outside text")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toContainText("line one")
      await expect(content.locator("p")).toContainText("outside text")
    })
  })

  test("can exit code block with ArrowDown when code block is last element", async ({ page, editor }) => {
    await editor.setValue("<pre><code>some code</code></pre>")
    await editor.click()

    // Position cursor at the end of the code block
    await editor.send("End")

    // Press ArrowDown — should move cursor out of the code block
    await editor.send("ArrowDown")

    // Type text that should appear in a new paragraph after the code block
    await editor.send("after code")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toContainText("some code")
      await expect(content.locator("p")).toContainText("after code")
    })
  })
})
