import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, recreateEditor, setContent } from "../unit/helpers/editor_helper"
import { NativeAdapter } from "../../../src/editor/adapters/native_adapter"
import { captureAttributesChange } from "./helpers/attributes_capture"

let editorElement
let capture

afterEach(async () => {
  capture?.dispose()
  await destroyTestEditor(editorElement)
})

describe("state restoration (kill/resume)", () => {
  test("registering an adapter after recreate emits editor-initialized then attributes-change", async () => {
    editorElement = await createTestEditor({ value: "<p>hello</p>" })
    editorElement.registerAdapter(new NativeAdapter(editorElement))
    await recreateEditor(editorElement)

    const order = []
    editorElement.addEventListener("lexxy:editor-initialized", () => order.push("initialized"))
    editorElement.addEventListener("lexxy:attributes-change", () => order.push("attributes"))

    editorElement.registerAdapter(new NativeAdapter(editorElement))

    expect(order).toEqual([ "initialized", "attributes" ])
  })

  test("after recreate + re-register, format toggles still dispatch attributes-change", async () => {
    editorElement = await createTestEditor({ value: "<p>hello</p>" })
    editorElement.registerAdapter(new NativeAdapter(editorElement))
    await recreateEditor(editorElement)
    editorElement.registerAdapter(new NativeAdapter(editorElement))

    capture = captureAttributesChange(editorElement)
    await setContent(editorElement, "<p>more</p>")

    expect(capture.count).toBeGreaterThan(0)
  })

  test("recreated editor's first payload after re-register reflects restored heading", async () => {
    editorElement = await createTestEditor({ value: "<h2>heading</h2>" })
    editorElement.registerAdapter(new NativeAdapter(editorElement))
    await recreateEditor(editorElement)

    capture = captureAttributesChange(editorElement)
    editorElement.registerAdapter(new NativeAdapter(editorElement))

    expect(capture.last.headingTag).toBe("h2")
    expect(capture.last.attributes.heading.active).toBe(true)
  })

  test("after recreate, the default adapter is BrowserAdapter (events go silent until re-register)", async () => {
    editorElement = await createTestEditor({ value: "<p>hello</p>" })
    editorElement.registerAdapter(new NativeAdapter(editorElement))
    await recreateEditor(editorElement)

    capture = captureAttributesChange(editorElement)
    await setContent(editorElement, "<p>more</p>")

    expect(capture.count).toBe(0)
  })
})
