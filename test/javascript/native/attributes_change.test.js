import { afterEach, describe, expect, test } from "vitest"
import { $getRoot } from "lexical"
import { createTestEditorWithNativeAdapter, destroyTestEditor, setContent, selectAll, captureEvent } from "../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("attributes change event", () => {
  test("dispatches event with all expected attribute keys", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    const expectedKeys = [
      "bold", "italic", "strikethrough", "code", "highlight",
      "link", "quote", "heading", "unordered-list", "ordered-list",
      "undo", "redo"
    ]

    expect(Object.keys(event.detail.attributes).sort()).toEqual(expectedKeys.sort())
  })

  test("each attribute has active and enabled properties", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    for (const [key, value] of Object.entries(event.detail.attributes)) {
      expect(value).toHaveProperty("active")
      expect(value).toHaveProperty("enabled")
      expect(typeof value.active).toBe("boolean")
      expect(typeof value.enabled).toBe("boolean")
    }
  })

  test("reports formatting attributes as inactive for plain text", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.bold).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.italic).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.strikethrough).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.code).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.link).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.quote).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes.heading).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes["unordered-list"]).toEqual({ active: false, enabled: true })
    expect(event.detail.attributes["ordered-list"]).toEqual({ active: false, enabled: true })
  })

  test("reports link as active with href when cursor is inside a link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><a href='https://example.com'>linked text</a></p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.link.active).toBe(true)
    expect(event.detail.link).toEqual({ href: "https://example.com" })
  })

  test("returns null link when not inside a link", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>plain text</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.link).toBeNull()
  })

  test("reports quote as active when inside a blockquote", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<blockquote>quoted text</blockquote>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.quote.active).toBe(true)
  })

  test("reports heading as active when inside a heading", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<h2>heading text</h2>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.heading.active).toBe(true)
  })

  test("includes undo/redo state", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello</p>")
    selectAll(editorElement)

    const event = await captureEvent(editorElement, "lexxy:attributes-change", () => {
      editorElement.dispatchAttributesChange()
    })

    expect(event.detail.attributes.undo).toEqual({ active: false, enabled: expect.any(Boolean) })
    expect(event.detail.attributes.redo).toEqual({ active: false, enabled: expect.any(Boolean) })
  })

  test("preserves text formatting when parsing HTML", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    // Bold
    await setContent(editorElement, "<p><strong>bold</strong></p>")
    let format = readFirstTextNodeFormat(editorElement)
    expect(format & 1).toBe(1) // bold bit

    // Italic
    await setContent(editorElement, "<p><em>italic</em></p>")
    format = readFirstTextNodeFormat(editorElement)
    expect(format & 2).toBe(2) // italic bit

    // Strikethrough
    await setContent(editorElement, "<p><s>struck</s></p>")
    format = readFirstTextNodeFormat(editorElement)
    expect(format & 4).toBe(4) // strikethrough bit
  })
})

function readFirstTextNodeFormat(editorElement) {
  let format = 0
  editorElement.editor.getEditorState().read(() => {
    format = $getRoot().getFirstDescendant().getFormat()
  })
  return format
}
