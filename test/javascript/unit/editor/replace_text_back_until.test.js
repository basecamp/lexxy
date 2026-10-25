import { describe, expect, test } from "vitest"
import { $createTextNode } from "lexical"
import { createTestEditor, destroyTestEditor, selectFirstText, setContent, tick } from "../helpers/editor_helper"

function replaceTextBackUntil(editorElement, stringToReplace, replacementText) {
  editorElement.editor.update(() => {
    editorElement.contents.replaceTextBackUntil(stringToReplace, $createTextNode(replacementText))
  }, { discrete: true })
}

describe("Contents#replaceTextBackUntil", () => {
  test("replaces text starting with a single-character trigger", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hello @Ali</p>")
    selectFirstText(editorElement, "Hello @Ali".length)

    replaceTextBackUntil(editorElement, "@Ali", "Alice")
    await tick()

    expect(editorElement.value).toContain("Hello Alice")
    expect(editorElement.value).not.toContain("@Ali")

    await destroyTestEditor(editorElement)
  })

  test("replaces a string that straddles the cursor, as when @ was just inserted before an existing word", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hello @Zacharias</p>")
    selectFirstText(editorElement, "Hello @".length)

    replaceTextBackUntil(editorElement, "@Zacharias", "Zacharias")
    await tick()

    expect(editorElement.value).toContain("Hello Zacharias")
    expect(editorElement.value).not.toContain("@Zacharias")

    await destroyTestEditor(editorElement)
  })

  test("replaces text starting with a repeated-character trigger like {{", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>Hello {{first</p>")
    selectFirstText(editorElement, "Hello {{first".length)

    replaceTextBackUntil(editorElement, "{{first", "{{ first_name }}")
    await tick()

    expect(editorElement.value).toContain("Hello {{ first_name }}")
    expect(editorElement.value).not.toContain("{{first")

    await destroyTestEditor(editorElement)
  })
})
