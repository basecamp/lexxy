import { afterEach, describe, expect, test } from "vitest"
import { PASTE_TAG } from "lexical"
import { highlightElement } from "../../../../src/helpers/code_highlighting_helper"
import { createTestEditor, destroyTestEditor } from "../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

// A rendered page highlights each saved code block, which turns every <br> into a
// newline. Copying that block and pasting it back must give the same code, not one
// more blank line each time.
describe("A code block saved, highlighted and pasted back", () => {
  async function saveHighlightAndPaste(html) {
    editorElement = await createTestEditor({ value: html })
    const saved = editorElement.value

    const rendered = document.createElement("div")
    rendered.innerHTML = saved
    highlightElement(rendered.querySelector("pre"))

    editorElement.value = ""
    editorElement.contents.insertHtml(rendered.innerHTML, { tag: PASTE_TAG })
    await editorElement.editor.read(() => {})

    return { saved, pasted: editorElement.value }
  }

  test("keeps a trailing blank line once", async () => {
    const { saved, pasted } = await saveHighlightAndPaste('<pre data-language="ruby">x = 1<br><br></pre>')

    expect(saved).toBe('<pre data-language="ruby" data-highlight-language="ruby">x = 1<br><br></pre>')
    expect(pasted).toBe(saved)
  })

  test("adds no blank line to code without one", async () => {
    const { saved, pasted } = await saveHighlightAndPaste('<pre data-language="ruby">x = 1<br>y = 2</pre>')

    expect(pasted).toBe(saved)
  })
})
