import { afterEach, describe, expect, test } from "vitest"
import { $createLineBreakNode, $createParagraphNode, $createRangeSelection, $getRoot, $setSelection } from "lexical"
import { LinkNode } from "@lexical/link"
import { createTestEditorWithNativeAdapter, destroyTestEditor, setContent, selectAll, tick } from "../unit/helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("selection freeze and thaw", () => {
  test("freeze disables contentEditable", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello</p>")

    editorElement.freezeSelection()

    expect(editorElement.editorContentElement.contentEditable).toBe("false")
  })

  test("thaw re-enables contentEditable", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello</p>")

    editorElement.freezeSelection()
    editorElement.thawSelection()

    expect(editorElement.editorContentElement.contentEditable).toBe("true")
  })

  test("freeze captures link node key when cursor is inside a link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><a href='https://example.com'>link text</a></p>")
    selectAll(editorElement)

    editorElement.freezeSelection()

    expect(editorElement.adapter.frozenLinkKey).not.toBeNull()
  })

  test("freeze sets frozenLinkKey to null when not inside a link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>plain text</p>")
    selectAll(editorElement)

    editorElement.freezeSelection()

    expect(editorElement.adapter.frozenLinkKey).toBeNull()
  })

  test("frozen link key is preserved after thaw", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><a href='https://example.com'>link text</a></p>")
    selectAll(editorElement)

    editorElement.freezeSelection()
    const frozenKey = editorElement.adapter.frozenLinkKey
    expect(frozenKey).not.toBeNull()

    editorElement.thawSelection()

    // The frozen key is preserved after thaw for the unlink command to use
    expect(editorElement.adapter.frozenLinkKey).toBe(frozenKey)
  })

  test("unlink command consumes frozenLinkKey and removes the frozen link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><a href='https://example.com'>link text</a></p>")
    selectAll(editorElement)

    editorElement.freezeSelection()
    editorElement.thawSelection()
    editorElement.editor.dispatchCommand("unlink", undefined)
    await tick()

    expect(editorElement.value).not.toContain("<a ")
    expect(editorElement.adapter.frozenLinkKey).toBeNull()
  })

  test("unlink falls back to current selection when frozen key is stale", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    await setContent(editorElement, "<p><a href='https://old.example'>old</a></p>")
    selectAll(editorElement)
    editorElement.freezeSelection()
    editorElement.thawSelection()

    await setContent(editorElement, "<p><a href='https://new.example'>new</a></p>")
    selectAll(editorElement)

    editorElement.editor.dispatchCommand("unlink", undefined)
    await tick()

    expect(editorElement.value).not.toContain("<a ")
    expect(editorElement.adapter.frozenLinkKey).toBeNull()
  })

  test("unlinkFrozenNode returns false when no frozen link key exists", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    const handled = editorElement.adapter.unlinkFrozenNode()

    expect(handled).toBe(false)
  })

  test("unlinkFrozenNode handles links without text descendants", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    let handled = false
    editorElement.editor.update(() => {
      const root = $getRoot()
      root.clear()

      const paragraph = $createParagraphNode()
      const linkNode = new LinkNode("https://example.com")
      linkNode.append($createLineBreakNode())
      paragraph.append(linkNode)
      root.append(paragraph)

      const selection = $createRangeSelection()
      selection.anchor.set(paragraph.getKey(), 0, "element")
      selection.focus.set(paragraph.getKey(), 1, "element")
      $setSelection(selection)

      editorElement.adapter.frozenLinkKey = linkNode.getKey()
      handled = editorElement.adapter.unlinkFrozenNode()
    })
    await tick()

    expect(handled).toBe(true)
    expect(editorElement.adapter.frozenLinkKey).toBeNull()
    expect(editorElement.value).not.toContain("<a ")
  })
})
