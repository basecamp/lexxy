import { afterEach, describe, expect, test } from "vitest"
import { $setSelection } from "lexical"
import { createMockAdapter, createTestEditor, destroyTestEditor, selectAll, setContent, tick } from "../unit/helpers/editor_helper"
import { BrowserAdapter } from "../../../src/editor/adapters/browser_adapter"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("adapter registration", () => {
  test("editor uses BrowserAdapter by default", async () => {
    editorElement = await createTestEditor()

    expect(editorElement.adapter).toBeInstanceOf(BrowserAdapter)
  })

  test("registerAdapter replaces the default adapter", async () => {
    editorElement = await createTestEditor()

    const { adapter: customAdapter } = createMockAdapter()

    editorElement.registerAdapter(customAdapter)

    expect(editorElement.adapter).toBe(customAdapter)
  })

  test("registerAdapter immediately syncs initialized and attributes state", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    const { initialized: initializedPayloads, attrs: attributesPayloads, adapter: customAdapter } = createMockAdapter()

    editorElement.registerAdapter(customAdapter)

    expect(initializedPayloads).toHaveLength(1)
    expect(initializedPayloads[0]).toHaveProperty("highlightColors")
    expect(initializedPayloads[0]).toHaveProperty("headingFormats")
    expect(attributesPayloads).toHaveLength(1)
    expect(attributesPayloads[0].attributes).toBeTruthy()
    expect(attributesPayloads[0]).toHaveProperty("headingTag")
  })

  test("dispatchEditorInitialized is safe after disconnect", async () => {
    editorElement = await createTestEditor()
    await destroyTestEditor(editorElement)

    expect(() => editorElement.dispatchEditorInitialized()).not.toThrow()
  })

  test("registerAdapter does not double-dispatch initialized before first frame", async () => {
    editorElement = await createTestEditor({ skipTick: true })

    const { initialized: initializedPayloads, adapter: customAdapter } = createMockAdapter()

    editorElement.registerAdapter(customAdapter)
    await tick()

    expect(initializedPayloads).toHaveLength(1)
  })

  test("dispatchAttributesChange is safe after disconnect", async () => {
    editorElement = await createTestEditor()
    await destroyTestEditor(editorElement)

    expect(() => editorElement.dispatchAttributesChange()).not.toThrow()
  })

  test("registerAdapter before any content does not dispatch attributes-change but dispatches initialized", async () => {
    editorElement = await createTestEditor()
    // Drop any default selection set during initialization so the adapter
    // sync only emits the editor-initialized event.
    editorElement.editor.update(() => {
      $setSelection(null)
    })
    await tick()

    const { initialized, attrs, adapter } = createMockAdapter()

    editorElement.registerAdapter(adapter)

    expect(initialized).toHaveLength(1)
    expect(attrs).toHaveLength(0)
  })

  test("registerAdapter immediately after setContent (no selection) syncs initialized only", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello world</p>")
    // jsdom may leave a selection at end-of-content after setContent; clear it.
    editorElement.editor.update(() => {
      $setSelection(null)
    })
    await tick()

    const { initialized, attrs, adapter } = createMockAdapter()

    editorElement.registerAdapter(adapter)

    expect(initialized).toHaveLength(1)
    expect(attrs).toHaveLength(0)
  })

  test("replacing adapter A with adapter B routes subsequent events only to B", async () => {
    editorElement = await createTestEditor()

    const { initialized: initializedA, attrs: attrsA, adapter: adapterA } = createMockAdapter()

    editorElement.registerAdapter(adapterA)

    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)
    // Capture baselines after async update-listener dispatches from setContent
    // and selectAll have settled, so the next assertion isolates the explicit
    // dispatchAttributesChange() call.
    const attrsABaselineAfterSelect = attrsA.length
    editorElement.dispatchAttributesChange()

    // dispatchAttributesChange() emits exactly one attributes-change.
    expect(attrsA.length).toBe(attrsABaselineAfterSelect + 1)
    const attrsAAfterFirstDispatch = attrsA.length
    const initializedAAfterFirstDispatch = initializedA.length

    const { initialized: initializedB, attrs: attrsB, adapter: adapterB } = createMockAdapter()

    expect(initializedB).toHaveLength(0)
    expect(attrsB).toHaveLength(0)

    editorElement.registerAdapter(adapterB)

    // registerAdapter is synchronous and emits exactly one editor-initialized
    // plus one attributes-change (a RangeSelection exists from the selectAll).
    expect(initializedB).toHaveLength(1)
    expect(attrsB).toHaveLength(1)

    editorElement.dispatchAttributesChange()

    // A is no longer the registered adapter and must not receive new events.
    expect(attrsA.length).toBe(attrsAAfterFirstDispatch)
    expect(initializedA.length).toBe(initializedAAfterFirstDispatch)
    // dispatchAttributesChange() emits exactly one attributes-change on B
    // and zero editor-initialized.
    expect(attrsB).toHaveLength(2)
    expect(initializedB).toHaveLength(1)
  })
})
