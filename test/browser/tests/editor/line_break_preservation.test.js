import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

// Lexical's LineBreakNode.importDOM drops a <br> that is the last child of a
// block, treating it as the phantom break browsers add to keep an empty line
// visible. That also discards a genuine soft break the user typed at the end
// of a line, so trailing breaks erode one per edit -> save -> re-edit cycle
// (the save round-trip re-imports the stored HTML). These tests exercise that
// import path directly via setValue/value.
test.describe("Trailing line break preservation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("keeps a single trailing soft break in a content block", async ({ editor }) => {
    await editor.setValue("<p>First line<br></p>")
    expect(await editor.value()).toContain("First line<br>")
  })

  test("keeps multiple trailing soft breaks (Shift+Enter twice)", async ({ editor }) => {
    await editor.setValue("<p>First line<br><br></p>")
    expect(await editor.value()).toContain("First line<br><br>")
  })

  test("leaves an empty paragraph empty (no stray break added)", async ({ editor }) => {
    await editor.setValue("<p>first</p><p><br></p><p>last</p>")
    await assertEditorHtml(editor, "<p>first</p><p><br></p><p>last</p>")
  })
})
