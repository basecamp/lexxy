import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, selectAll, setContent, tick } from "../unit/helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("setCodeLanguage command", () => {
  test("updates the language of the selected code block", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<pre><code class=\"language-plain\">puts 'hello'</code></pre>")
    selectAll(editorElement)

    editorElement.editor.dispatchCommand("setCodeLanguage", "ruby")
    await tick()

    expect(editorElement.value).toContain("data-language=\"ruby\"")
  })

  test("does not throw when selection is outside code blocks", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>plain text</p>")
    selectAll(editorElement)

    expect(() => editorElement.editor.dispatchCommand("setCodeLanguage", "ruby")).not.toThrow()
  })
})
