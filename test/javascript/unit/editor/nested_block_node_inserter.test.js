import { afterEach, describe, expect, test } from "vitest"
import { $getRoot, PASTE_TAG } from "lexical"
import { createTestEditor, destroyTestEditor, setContent } from "../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

// Lexical flattens blocks pasted into a block whose parent is not a root or a
// shadow root, such as a paragraph inside a quote. Lexxy inserts them as blocks.
describe("Pasting blocks into a paragraph inside a quote", () => {
  async function pasteIntoQuote(html, offset) {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<blockquote><p>Hello world</p></blockquote>")

    editorElement.editor.update(() => {
      $getRoot().getFirstChild().getFirstChild().getFirstChild().select(offset, offset)
    }, { discrete: true })
    editorElement.contents.insertHtml(html, { tag: PASTE_TAG })
    await editorElement.editor.read(() => {})

    return editorElement.value
  }

  test("keeps pasted paragraphs apart", async () => {
    expect(await pasteIntoQuote("<p>A</p><p>B</p>", 5))
      .toBe("<blockquote><p>HelloA</p><p>B world</p></blockquote>")
  })

  test("keeps a pasted list whole and the rest of the line after it", async () => {
    expect(await pasteIntoQuote("<ul><li>L1</li><li>L2</li></ul>", 5))
      .toBe("<blockquote><p>Hello</p><ul><li value=\"1\">L1</li><li value=\"2\">L2</li></ul><p> world</p></blockquote>")
  })

  test("puts a list pasted at the start of the line before it", async () => {
    expect(await pasteIntoQuote("<ul><li>L</li></ul>", 0))
      .toBe("<blockquote><ul><li value=\"1\">L</li></ul><p>Hello world</p></blockquote>")
  })
})
