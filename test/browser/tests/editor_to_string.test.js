import { test } from "../test_helper.js"
import { assertEditorPlainText } from "../helpers/assertions.js"

test.describe("Editor toString", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("an empty editor returns an empty string", async ({ editor }) => {
    await assertEditorPlainText(editor, "")
  })

  test("text content is returned as-is", async ({ editor }) => {
    await editor.send("Hello World")
    await assertEditorPlainText(editor, "Hello World")
  })

  test("toString includes line breaks", async ({ editor }) => {
    await editor.send("Hello")
    await editor.send("Enter")
    await editor.send("World")

    await assertEditorPlainText(editor, "Hello\n\nWorld")
  })

  test("toString demo value", async ({ editor }) => {
    await editor.setValue(`<h3>Lexxy</h3>
<p>Introducing <a href="https://github.com/basecamp/lexxy">Lexxy</a></p>
<pre data-language="html" data-highlight-language="html">&lt;lexxy-editor placeholder="It all starts here..."&gt;<br>&lt;/lexxy-editor&gt;</pre>
<h4>Features</h4>
<ul>
  <li>Built on top of Lexical</li>
  <li>Text <mark style="color: var(--highlight-1);">highlights</mark></li>
</ul>
<blockquote>Quote block</blockquote>
<hr />`)

    await assertEditorPlainText(
      editor,
      `Lexxy

Introducing Lexxy

<lexxy-editor placeholder="It all starts here...">
</lexxy-editor>

Features

Built on top of Lexical

Text highlights

Quote block

┄

`,
    )
  })
})
