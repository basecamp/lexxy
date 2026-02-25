import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, setContent, selectAll } from "../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("selection freeze and thaw", () => {
  test("freeze disables contentEditable", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello</p>")

    editorElement.freezeSelection()

    expect(editorElement.editorContentElement.contentEditable).toBe("false")
  })

  test("thaw re-enables contentEditable", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello</p>")

    editorElement.freezeSelection()
    editorElement.thawSelection()

    expect(editorElement.editorContentElement.contentEditable).toBe("true")
  })

  test("freeze captures link node key when cursor is inside a link", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p><a href='https://example.com'>link text</a></p>")
    selectAll(editorElement)

    editorElement.freezeSelection()

    expect(editorElement.selection.frozenLinkKey).not.toBeNull()
  })

  test("freeze sets frozenLinkKey to null when not inside a link", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>plain text</p>")
    selectAll(editorElement)

    editorElement.freezeSelection()

    expect(editorElement.selection.frozenLinkKey).toBeNull()
  })

  test("frozen link key is preserved after thaw", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p><a href='https://example.com'>link text</a></p>")
    selectAll(editorElement)

    editorElement.freezeSelection()
    const frozenKey = editorElement.selection.frozenLinkKey
    expect(frozenKey).not.toBeNull()

    editorElement.thawSelection()

    // The frozen key is preserved after thaw for the unlink command to use
    expect(editorElement.selection.frozenLinkKey).toBe(frozenKey)
  })
})
