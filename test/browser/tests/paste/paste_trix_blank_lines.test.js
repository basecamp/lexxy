import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

// Trix writes each line as a <div> and a blank line as <div><br></div>. Lexical
// has no importer for <div>, and it drops a <br> that is the only child of a
// block, so without help a pasted blank line vanishes and the paragraphs
// around it run together.
async function pasteHtml(page, editor, html) {
  await page.goto("/")
  await editor.waitForConnected()
  startMonitoringConsole(page)

  await editor.setValue("<p></p>")
  await editor.focus()

  await editor.paste("ignored", { html })
  await editor.flush()
}

test.describe("Paste Trix content", () => {
  test("keeps a blank line between paragraphs", async ({ page, editor }) => {
    await pasteHtml(page, editor, "<div>First</div><div><br></div><div>Second</div>")

    await assertEditorHtml(editor, "<p>First</p><p><br></p><p>Second</p>")
    await expect(editor.content.locator(":scope > p")).toHaveCount(3)
    expect(page).toHaveNoErrors()
  })

  test("keeps consecutive blank lines", async ({ page, editor }) => {
    await pasteHtml(page, editor, "<div>First</div><div><br></div><div><br></div><div>Second</div>")

    await assertEditorHtml(editor, "<p>First</p><p><br></p><p><br></p><p>Second</p>")
    await expect(editor.content.locator(":scope > p")).toHaveCount(4)
    expect(page).toHaveNoErrors()
  })

  test("keeps blank lines copied from rendered Trix content", async ({ page, editor }) => {
    await pasteHtml(page, editor, `<div class="trix-content"><div>First</div><div><br></div><div>Second</div></div>`)

    await assertEditorHtml(editor, "<p>First</p><p><br></p><p>Second</p>")
    expect(page).toHaveNoErrors()
  })

  test("leaves lines with text as they were", async ({ page, editor }) => {
    await pasteHtml(page, editor, "<div>First<br>Second</div><div>Third</div>")

    await assertEditorHtml(editor, "<p>First<br>Second</p><p>Third</p>")
    expect(page).toHaveNoErrors()
  })
})
