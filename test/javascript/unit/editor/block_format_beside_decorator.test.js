import { describe, expect, test } from "vitest"
import { $getRoot } from "lexical"
import { createTestEditor, destroyTestEditor, dispatchToolbarCommand, setContent, tick } from "../helpers/editor_helper"

function selectFromFirstTextToLastText(editorElement, { anchorAtEnd = false, focusAtEnd = false } = {}) {
  editorElement.editor.update(() => {
    const root = $getRoot()
    const firstText = root.getFirstChild().getFirstDescendant()
    const lastText = root.getLastChild().getFirstDescendant()
    const anchorOffset = anchorAtEnd ? firstText.getTextContentSize() : 0
    const focusOffset = focusAtEnd ? lastText.getTextContentSize() : 0
    const selection = firstText.select(anchorOffset, anchorOffset)
    selection.focus.set(lastText.getKey(), focusOffset, "text")
  }, { discrete: true })
}

describe("block formats next to decorator nodes", () => {
  test("focus flush after a horizontal divider walks back past it, leaving the trailing block unformatted", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>alpha</p><hr><p>beta</p>")
    selectFromFirstTextToLastText(editorElement)

    expect(() => dispatchToolbarCommand(editorElement, "applyHeadingFormat", "h2")).not.toThrow()
    await tick()

    expect(editorElement.value).toContain("<h2>alpha</h2>")
    expect(editorElement.value).toContain("<p>beta</p>")
    expect(editorElement.value).toContain("<hr>")

    await destroyTestEditor(editorElement)
  })

  test("anchor flush before a horizontal divider walks forward past it, leaving the leading block unformatted", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>alpha</p><hr><p>beta</p>")
    selectFromFirstTextToLastText(editorElement, { anchorAtEnd: true, focusAtEnd: true })

    expect(() => dispatchToolbarCommand(editorElement, "applyHeadingFormat", "h2")).not.toThrow()
    await tick()

    expect(editorElement.value).toContain("<p>alpha</p>")
    expect(editorElement.value).toContain("<h2>beta</h2>")
    expect(editorElement.value).toContain("<hr>")

    await destroyTestEditor(editorElement)
  })

  test("selecting content in both blocks around a horizontal divider formats both and keeps the divider", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>alpha</p><hr><p>beta</p>")
    selectFromFirstTextToLastText(editorElement, { focusAtEnd: true })

    expect(() => dispatchToolbarCommand(editorElement, "applyHeadingFormat", "h2")).not.toThrow()
    await tick()

    expect(editorElement.value).toContain("<h2>alpha</h2>")
    expect(editorElement.value).toContain("<h2>beta</h2>")
    expect(editorElement.value).toContain("<hr>")

    await destroyTestEditor(editorElement)
  })

  // Both endpoints flush against the divider selects only the divider itself.
  // This behaves the same as the equivalent selection across two adjacent
  // paragraphs with no divider between them: everything gets wrapped.
  test("quote format with both edges flush against a horizontal divider does not throw", async () => {
    const editorElement = await createTestEditor()
    await setContent(editorElement, "<p>alpha</p><hr><p>beta</p>")
    selectFromFirstTextToLastText(editorElement, { anchorAtEnd: true })

    expect(() => dispatchToolbarCommand(editorElement, "insertQuoteBlock")).not.toThrow()
    await tick()

    expect(editorElement.value).toContain("<blockquote>")
    expect(editorElement.value).toContain("<hr>")

    await destroyTestEditor(editorElement)
  })
})
