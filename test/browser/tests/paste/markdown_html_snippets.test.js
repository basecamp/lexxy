import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorPlainText } from "../../helpers/assertions.js"

// Embed snippets, tracking codes and HTML samples pasted as plain text carry
// tags the editor can't import: script and style are dropped along with their
// content, and an iframe or an empty div has no content to keep. They must
// paste as the literal text the user copied.
test.describe("Paste — HTML snippets as plain text", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  // The snippet is a block of its own, so it starts a new paragraph.
  test("keeps an embed snippet that follows a line of prose", async ({ editor }) => {
    await editor.paste('Add this:\n<div id="w"></div>\n<script>window.x = 1</script>')

    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText('<div id="w"></div>')
      await expect(content).toContainText("<script>window.x = 1</script>")
      await expect(content.locator("pre, code[data-language]").first()).toHaveAttribute("data-language", "html")
    })
    await assertEditorPlainText(editor, 'Add this:\n\n<div id="w"></div>\n<script>window.x = 1</script>')
  })

  test("keeps a script tag in the middle of a sentence", async ({ editor }) => {
    await editor.paste('Put <script src="https://example.com/a.js"></script> before the closing body tag.')

    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText('Put <script src="https://example.com/a.js"></script> before the closing body tag.')
    })
  })

  test("keeps a style block", async ({ editor }) => {
    await editor.paste("Use this CSS:\n\n<style>\n.banner { color: red; }\n</style>")

    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText("Use this CSS:")
      await expect(content).toContainText("<style>")
      await expect(content).toContainText(".banner { color: red; }")
      await expect(content).toContainText("</style>")
    })
  })

  test("keeps an iframe embed", async ({ editor }) => {
    await editor.paste('Video:\n\n<iframe src="https://example.com/embed/1" width="560"></iframe>')

    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText('<iframe src="https://example.com/embed/1" width="560"></iframe>')
    })
  })

  test("still renders the markdown around a snippet", async ({ editor }) => {
    await editor.paste("# Install\n\nAdd **this** to your page:\n\n<script>track()</script>")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("h2, h1")).toHaveText("Install")
      await expect(content.locator("strong")).toHaveText("this")
      await expect(content).toContainText("<script>track()</script>")
    })
  })

  test("keeps the indentation and spacing of a block snippet", async ({ editor }) => {
    const snippet = '<script>\n  const s = "a  b";\n\tgo(s);\n</script>'
    await editor.paste(`Intro:\n\n${snippet}`)

    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText("Intro:")
    })
    await expect.poll(() => editor.plainTextValue()).toContain(snippet)
  })

  test("keeps markdown out of an inline script", async ({ editor }) => {
    await editor.paste("**Use** <script>console.log(`ok`)</script> here")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("strong")).toHaveText("Use")
      await expect(content).toContainText("<script>console.log(`ok`)</script> here")
    })
  })

  test("keeps markdown out of a nested inline template", async ({ editor }) => {
    await editor.paste("**Use** <template><template>nested</template>`literal`</template> here")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("strong")).toHaveText("Use")
      await expect(content).toContainText("<template><template>nested</template>`literal`</template> here")
    })
  })

  test("reads only the exact tag name as a script", async ({ editor }) => {
    await editor.paste("**bold** <script>const tag = \"</script-widget>\"; run(`ok`)</script> here")

    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText("<script>const tag = \"</script-widget>\"; run(`ok`)</script>")
      await expect(content.locator("strong")).toHaveText("bold")
    })
  })

  test("still imports formatting tags in markdown without a snippet", async ({ editor }) => {
    await editor.paste("Some <b>well known</b> words")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("b, strong")).toHaveText("well known")
    })
  })
})
