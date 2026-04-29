import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, setContent, tick } from "../unit/helpers/editor_helper"
import { BrowserAdapter } from "../../../src/editor/adapters/browser_adapter"
import { NativeAdapter } from "../../../src/editor/adapters/native_adapter"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("adapter swap", () => {
  test("editor uses BrowserAdapter by default", async () => {
    editorElement = await createTestEditor()
    expect(editorElement.adapter).toBeInstanceOf(BrowserAdapter)
  })

  test("registerAdapter replaces the default adapter", async () => {
    editorElement = await createTestEditor()
    const adapter = new NativeAdapter(editorElement)
    editorElement.registerAdapter(adapter)
    expect(editorElement.adapter).toBe(adapter)
  })

  test("registerAdapter immediately syncs initialized and attributes-change to the new adapter", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello</p>")

    const initialized = []
    const attrs = []
    const adapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) { initialized.push(detail) },
      dispatchAttributesChange() { attrs.push(true) },
      freeze() {},
      thaw() {},
      unlinkFrozenNode() { return false }
    }

    editorElement.registerAdapter(adapter)

    expect(initialized).toHaveLength(1)
    expect(attrs.length).toBeGreaterThanOrEqual(1)
  })

  test("after registering B, prior adapter A receives no further events", async () => {
    editorElement = await createTestEditor()

    const aAttrs = []
    const adapterA = {
      frozenLinkKey: null,
      dispatchEditorInitialized() {},
      dispatchAttributesChange() { aAttrs.push(true) },
      freeze() {}, thaw() {}, unlinkFrozenNode() { return false }
    }
    editorElement.registerAdapter(adapterA)
    aAttrs.length = 0

    const adapterB = {
      frozenLinkKey: null,
      dispatchEditorInitialized() {},
      dispatchAttributesChange() {},
      freeze() {}, thaw() {}, unlinkFrozenNode() { return false }
    }
    editorElement.registerAdapter(adapterB)

    await setContent(editorElement, "<p>after swap</p>")
    await tick()

    expect(aAttrs).toEqual([])
  })

  test("re-registering the same adapter instance behaves identically", async () => {
    editorElement = await createTestEditor()
    const adapter = new NativeAdapter(editorElement)
    editorElement.registerAdapter(adapter)

    expect(() => editorElement.registerAdapter(adapter)).not.toThrow()
    expect(editorElement.adapter).toBe(adapter)
  })

  test("registerAdapter works before any selection or editor update", async () => {
    editorElement = await createTestEditor({ skipTick: true })

    const initialized = []
    const adapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) { initialized.push(detail) },
      dispatchAttributesChange() {},
      freeze() {}, thaw() {}, unlinkFrozenNode() { return false }
    }

    editorElement.registerAdapter(adapter)
    await tick()

    expect(initialized).toHaveLength(1)
  })

  test("dispatchEditorInitialized is safe after disconnect", async () => {
    editorElement = await createTestEditor()
    await destroyTestEditor(editorElement)

    expect(() => editorElement.dispatchEditorInitialized()).not.toThrow()
  })
})
