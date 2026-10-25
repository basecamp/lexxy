import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

// Reproduces Lexical error #66 ("Expected node %s to have a parent"): pasting block
// content with the caret on a blank-but-not-empty list item inside a blockquote.
// EarlyEscapeListItemNode used to treat Lexical's internal paste-time insertNewAfter
// call as an escape gesture, removing the list item that insertNodes still references —
// throwing the invariant and losing the pasted content.
test.describe("Paste into quoted list", () => {
  test("pasting block content with the caret on a blank quoted list item keeps the pasted blocks", async ({
    page,
    editor,
  }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    startMonitoringConsole(page)

    await editor.setValue("<blockquote><ul><li>item</li></ul></blockquote>")
    await editor.focus()

    // Recreate the production path: Enter adds an empty bullet below "item",
    // then Shift+Enter leaves it blank-but-not-empty with a collapsed caret on it.
    await editor.send("End", "Enter", "Shift+Enter")

    await editor.paste("first\nsecond", { html: "<p>first</p><p>second</p>" })
    await editor.flush()

    await assertEditorHtml(
      editor,
      '<blockquote><ul><li value="1">item</li><li value="2"><br>first</li></ul><p>second</p></blockquote>',
    )
    expect(page).toHaveNoErrors()
  })
})
