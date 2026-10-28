import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Code block language on import", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("reads the language from a language class on code", async ({ editor }) => {
    await editor.setValue('<pre><code class="language-ruby">def hello\nend</code></pre>')
    await assertEditorHtml(editor, '<pre data-language="ruby" data-highlight-language="ruby">def hello<br>end</pre>')
  })

  test("reads the language from lang on pre", async ({ editor }) => {
    await editor.setValue('<pre lang="ruby"><code>def hello\nend</code></pre>')
    await assertEditorHtml(editor, '<pre data-language="ruby" data-highlight-language="ruby">def hello<br>end</pre>')
  })

  test("normalizes a language alias", async ({ editor }) => {
    await editor.setValue('<pre><code class="language-javascript">const a = 1</code></pre>')
    await assertEditorHtml(editor, '<pre data-language="js" data-highlight-language="js">const a = 1</pre>')
  })

  test("prefers data-language over the language class", async ({ editor }) => {
    await editor.setValue('<pre data-language="python"><code class="language-ruby">def hello\nend</code></pre>')
    await assertEditorHtml(editor, '<pre data-language="python" data-highlight-language="python">def hello<br>end</pre>')
  })

  test("ignores an unknown language class", async ({ editor }) => {
    await editor.setValue('<pre><code class="language-klingon">def hello\nend</code></pre>')
    await assertEditorHtml(editor, '<pre data-language="javascript" data-highlight-language="javascript">def hello<br>end</pre>')
  })

  test("keeps the language of a pasted markdown fence", async ({ editor }) => {
    await editor.paste("Some code:\n\n```ruby\ndef hello\nend\n```")
    await assertEditorHtml(editor, '<p>Some code:</p><pre data-language="ruby" data-highlight-language="ruby">def hello<br>end</pre>')
  })
})
