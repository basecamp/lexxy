import { afterEach, describe, expect, test } from "vitest"
import { NativeAdapter } from "../../../src/editor/adapters/native_adapter"
import {
  createTestEditorWithNativeAdapter,
  destroyTestEditor,
  recreateEditor,
  setContent,
  selectAll,
  tick
} from "../unit/helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("state restoration after teardown and recreation", () => {
  // Card #9828466892 — iOS toolbar fails to reflect formatting state after app kill/resume.
  test.fails("re-registering the native adapter after recreation re-emits attributes-change with current state", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    await setContent(editorElement, "<p><strong>bold</strong></p>")
    selectAll(editorElement)

    await recreateEditor(editorElement)

    await setContent(editorElement, "<p><strong>bold</strong></p>")
    selectAll(editorElement)

    const adapter = new NativeAdapter(editorElement)
    const events = []
    editorElement.addEventListener("lexxy:attributes-change", (event) => events.push(event))

    editorElement.registerAdapter(adapter)
    await tick()

    expect(events).toHaveLength(1)
    expect(events[0].detail.attributes.bold.active).toBe(true)
  })

  // Card #9828466892 — iOS toolbar fails to reflect formatting state after app kill/resume.
  test.fails("re-registering the same adapter instance after recreation still re-emits state", async () => {
    editorElement = await createTestEditorWithNativeAdapter()
    const originalAdapter = editorElement.adapter
    await setContent(editorElement, "<p><strong>bold</strong></p>")
    selectAll(editorElement)

    await recreateEditor(editorElement)

    await setContent(editorElement, "<p><strong>bold</strong></p>")
    selectAll(editorElement)

    const events = []
    editorElement.addEventListener("lexxy:attributes-change", (event) => events.push(event))

    editorElement.registerAdapter(originalAdapter)
    await tick()

    expect(events).toHaveLength(1)
    expect(events[0].detail.attributes.bold.active).toBe(true)
  })

  test("re-registering after recreation re-emits editor-initialized payload", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    await recreateEditor(editorElement)

    const adapter = new NativeAdapter(editorElement)
    const events = []
    editorElement.addEventListener("lexxy:editor-initialized", (event) => events.push(event))

    editorElement.registerAdapter(adapter)
    await tick()

    expect(events.length).toBeGreaterThanOrEqual(1)
    const lastEvent = events[events.length - 1]
    expect(lastEvent.detail.headingFormats).toEqual([
      { label: "Normal", command: "setFormatParagraph", tag: null },
      { label: "Large heading", command: "setFormatHeadingLarge", tag: "h2" },
      { label: "Medium heading", command: "setFormatHeadingMedium", tag: "h3" },
      { label: "Small heading", command: "setFormatHeadingSmall", tag: "h4" },
    ])
  })
})
