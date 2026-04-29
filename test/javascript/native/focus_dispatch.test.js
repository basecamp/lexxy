import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, createTestEditorWithNativeAdapter, destroyTestEditor, recreateEditor, setContent } from "../unit/helpers/editor_helper"
import { NativeAdapter } from "../../../src/editor/adapters/native_adapter"
import { captureAttributesChange } from "./helpers/attributes_capture"

let editorElement
let capture

afterEach(async () => {
  capture?.dispose()
  await destroyTestEditor(editorElement)
})

function dispatchFocusIn(element) {
  const target = element.editorContentElement || element
  target.dispatchEvent(new FocusEvent("focusin", { bubbles: true }))
}

describe("focus dispatch", () => {
  test("first focusin after registerAdapter emits a fresh attributes-change", async () => {
    editorElement = await createTestEditor({ value: "<p>hello</p>" })
    editorElement.registerAdapter(new NativeAdapter(editorElement))

    capture = captureAttributesChange(editorElement)
    dispatchFocusIn(editorElement)

    expect(capture.count).toBeGreaterThan(0)
  })

  test("first focusin after kill/resume + re-register emits a fresh attributes-change", async () => {
    editorElement = await createTestEditorWithNativeAdapter({ value: "<p>hello</p>" })
    dispatchFocusIn(editorElement)
    await recreateEditor(editorElement)
    editorElement.registerAdapter(new NativeAdapter(editorElement))

    capture = captureAttributesChange(editorElement)
    dispatchFocusIn(editorElement)

    expect(capture.count).toBeGreaterThan(0)
  })

  test("focusin while already focused does not re-dispatch", async () => {
    editorElement = await createTestEditorWithNativeAdapter({ value: "<p>hello</p>" })
    dispatchFocusIn(editorElement)
    await setContent(editorElement, "<p>hello</p>")

    capture = captureAttributesChange(editorElement)
    dispatchFocusIn(editorElement)

    expect(capture.count).toBe(0)
  })
})
