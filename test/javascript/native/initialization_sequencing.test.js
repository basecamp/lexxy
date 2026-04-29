import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor } from "../unit/helpers/editor_helper"
import { NativeAdapter } from "../../../src/editor/adapters/native_adapter"
import { captureAttributesChange } from "./helpers/attributes_capture"

let editorElement
let capture

afterEach(async () => {
  capture?.dispose()
  await destroyTestEditor(editorElement)
})

describe("initialization sequencing", () => {
  test("registerAdapter emits editor-initialized then attributes-change", async () => {
    editorElement = await createTestEditor()

    const order = []
    editorElement.addEventListener("lexxy:editor-initialized", () => order.push("initialized"))
    editorElement.addEventListener("lexxy:attributes-change", () => order.push("attributes"))

    capture = captureAttributesChange(editorElement)
    editorElement.registerAdapter(new NativeAdapter(editorElement))

    expect(order).toEqual([ "initialized", "attributes" ])
  })

  test("registerAdapter emits exactly one attributes-change", async () => {
    editorElement = await createTestEditor()
    capture = captureAttributesChange(editorElement)

    editorElement.registerAdapter(new NativeAdapter(editorElement))

    expect(capture.count).toBe(1)
  })

  test("first dispatched payload is renderable (full contract)", async () => {
    editorElement = await createTestEditor()
    capture = captureAttributesChange(editorElement)

    editorElement.registerAdapter(new NativeAdapter(editorElement))

    expect(capture.violations).toEqual([])
    expect(capture.last.attributes).toBeTruthy()
  })
})
