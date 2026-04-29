import { afterEach, describe, expect, test } from "vitest"
import { $createLineBreakNode, $createParagraphNode, $createRangeSelection, $getRoot, $setSelection } from "lexical"
import { LinkNode } from "@lexical/link"
import { createTestEditorWithNativeAdapter, destroyTestEditor, selectAll, setContent, tick } from "../unit/helpers/editor_helper"
import { captureAttributesChange } from "./helpers/attributes_capture"

let editorElement
let capture

afterEach(async () => {
  capture?.dispose()
  await destroyTestEditor(editorElement)
})

describe("freeze, thaw, unlink", () => {
  test("freeze disables contentEditable and emits no attributes-change", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello</p>")
    capture = captureAttributesChange(editorElement)

    editorElement.freezeSelection()

    expect(editorElement.editorContentElement.contentEditable).toBe("false")
    expect(capture.count).toBe(0)
  })

  test("thaw re-enables contentEditable and emits no attributes-change", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello</p>")
    editorElement.freezeSelection()
    capture = captureAttributesChange(editorElement)

    editorElement.thawSelection()

    expect(editorElement.editorContentElement.contentEditable).toBe("true")
    expect(capture.count).toBe(0)
  })

  test("freeze captures the link key when cursor is inside a link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><a href='https://example.com'>link</a></p>")
    selectAll(editorElement)

    editorElement.freezeSelection()

    expect(editorElement.adapter.frozenLinkKey).not.toBeNull()
  })

  test("freeze captures null when cursor is not inside a link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>plain</p>")
    selectAll(editorElement)

    editorElement.freezeSelection()

    expect(editorElement.adapter.frozenLinkKey).toBeNull()
  })

  test("double freeze overwrites the prior frozen key", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><a href='https://example.com'>first</a></p>")
    selectAll(editorElement)
    editorElement.freezeSelection()
    editorElement.thawSelection()

    await setContent(editorElement, "<p>plain</p>")
    selectAll(editorElement)
    editorElement.freezeSelection()

    expect(editorElement.adapter.frozenLinkKey).toBeNull()
  })

  test("thaw without prior freeze is harmless", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>plain</p>")

    expect(() => editorElement.thawSelection()).not.toThrow()
    expect(editorElement.editorContentElement.contentEditable).toBe("true")
  })

  test("frozen link key is preserved after thaw", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><a href='https://example.com'>linked</a></p>")
    selectAll(editorElement)

    editorElement.freezeSelection()
    const frozenKey = editorElement.adapter.frozenLinkKey
    expect(frozenKey).not.toBeNull()

    editorElement.thawSelection()
    expect(editorElement.adapter.frozenLinkKey).toBe(frozenKey)
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

  test("unlinkFrozenNode unwraps the link and the next dispatch reports link.active false", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><a href='https://example.com'>linked</a></p>")
    selectAll(editorElement)
    editorElement.freezeSelection()
    editorElement.thawSelection()
    capture = captureAttributesChange(editorElement)

    editorElement.editor.dispatchCommand("unlink", undefined)
    await tick()

    expect(editorElement.value).not.toContain("<a ")
    expect(editorElement.adapter.frozenLinkKey).toBeNull()
    expect(capture.last.link.active).toBe(false)
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
  })
})
