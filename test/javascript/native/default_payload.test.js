import { afterEach, describe, expect, test } from "vitest"
import { $createNodeSelection, $getRoot, $setSelection } from "lexical"
import { HorizontalDividerNode } from "../../../src/nodes/horizontal_divider_node"
import { createTestEditor, createTestEditorWithNativeAdapter, destroyTestEditor, selectAll, setContent, tick } from "../unit/helpers/editor_helper"
import { NativeAdapter } from "../../../src/editor/adapters/native_adapter"
import { captureAttributesChange } from "./helpers/attributes_capture"

const EXPECTED_DEFAULT_ATTRIBUTES = {
  bold:             { active: false, enabled: false },
  italic:           { active: false, enabled: false },
  strikethrough:    { active: false, enabled: false },
  code:             { active: false, enabled: false },
  highlight:        { active: false, enabled: false },
  link:             { active: false, enabled: false },
  quote:            { active: false, enabled: false },
  heading:          { active: false, enabled: false },
  "unordered-list": { active: false, enabled: false },
  "ordered-list":   { active: false, enabled: false },
  undo:             { active: false, enabled: false },
  redo:             { active: false, enabled: false },
}

const EXPECTED_KEYS = Object.keys(EXPECTED_DEFAULT_ATTRIBUTES).sort()

let editorElement
let capture

afterEach(async () => {
  capture?.dispose()
  await destroyTestEditor(editorElement)
})

describe("default payload contract", () => {
  test("dispatch with no RangeSelection emits the default attributes payload", async () => {
    editorElement = await createTestEditor()
    editorElement.editor.update(() => $setSelection(null))
    await tick()
    capture = captureAttributesChange(editorElement)

    editorElement.registerAdapter(new NativeAdapter(editorElement))

    const { attributes, link, highlight, headingTag } = capture.last
    expect(attributes).toEqual(EXPECTED_DEFAULT_ATTRIBUTES)
    expect(link).toBeNull()
    expect(highlight).toBeNull()
    expect(headingTag).toBeNull()
  })

  test("payload always carries every attribute key", async () => {
    editorElement = await createTestEditor()
    capture = captureAttributesChange(editorElement)
    editorElement.registerAdapter(new NativeAdapter(editorElement))

    await setContent(editorElement, "<p>hello</p>")

    for (const detail of capture.events) {
      expect(Object.keys(detail.attributes).sort()).toEqual(EXPECTED_KEYS)
    }
  })

  test("brand-new editor with content but no selection still emits a renderable payload", async () => {
    editorElement = await createTestEditor({ value: "<p>hello</p>" })
    capture = captureAttributesChange(editorElement)

    editorElement.registerAdapter(new NativeAdapter(editorElement))

    expect(capture.last).toBeTruthy()
    expect(capture.violations).toEqual([])
  })

  test("dispatch with a node selection emits the default attributes payload", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>before</p><hr><p>after</p>")
    editorElement.editor.update(() => {
      const divider = $getRoot().getChildren().find(node => node instanceof HorizontalDividerNode)
      const selection = $createNodeSelection()
      selection.add(divider.getKey())
      $setSelection(selection)
    }, { discrete: true })
    capture = captureAttributesChange(editorElement)

    editorElement.dispatchAttributesChange()

    expect(capture.last.attributes).toEqual({
      ...EXPECTED_DEFAULT_ATTRIBUTES,
      undo: { active: false, enabled: expect.any(Boolean) },
      redo: { active: false, enabled: expect.any(Boolean) },
    })
    expect(capture.last.link).toBeNull()
    expect(capture.last.highlight).toBeNull()
  })

  test("dispatch with a plain-text RangeSelection emits all attributes inactive but enabled", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)
    capture = captureAttributesChange(editorElement)

    editorElement.dispatchAttributesChange()

    const expected = enableAll(EXPECTED_DEFAULT_ATTRIBUTES, {
      undo: { active: false, enabled: expect.any(Boolean) },
      redo: { active: false, enabled: expect.any(Boolean) },
    })
    expect(capture.last.attributes).toEqual(expected)
    expect(capture.last.link).toBeNull()
    expect(capture.last.highlight).toBeNull()
  })
})

function enableAll(defaults, overrides) {
  return Object.fromEntries(
    Object.entries(defaults).map(([ key, value ]) => [ key, overrides[key] ?? { ...value, enabled: true } ])
  )
}
