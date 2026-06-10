import { describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, dispatchToolbarCommand, selectAll, selectFirstText, setContent, tick } from "../helpers/editor_helper"

describe("insertCodeBlock command", () => {
  test("converts a selection spanning a paragraph and a quote without losing the selection", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>before</p><blockquote><p>quoted</p></blockquote>")
    selectAll(editorElement)

    expect(() => dispatchToolbarCommand(editorElement, "insertCodeBlock")).not.toThrow()
    await tick()

    expect(editorElement.value).toContain("<pre")
    expect(editorElement.value).toContain("before<br>quoted")

    await destroyTestEditor(editorElement)
  })

  test("converts a nested list with the caret inside it without losing the selection", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<ul><li>item one<ul><li>nested</li></ul></li></ul>")
    selectFirstText(editorElement, 2)

    expect(() => dispatchToolbarCommand(editorElement, "insertCodeBlock")).not.toThrow()
    await tick()

    expect(editorElement.value).toContain("<pre")
    expect(editorElement.value).toContain("item one<br>nested")

    await destroyTestEditor(editorElement)
  })
})
