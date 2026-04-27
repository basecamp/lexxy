import { afterEach, describe, expect, test } from "vitest"
import { $setSelection } from "lexical"
import { createTestEditor, destroyTestEditor, selectAll, setContent, tick } from "../unit/helpers/editor_helper"
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

    const customAdapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized() {},
      dispatchAttributesChange() {},
      freeze() {},
      thaw() {}
    }

    editorElement.registerAdapter(customAdapter)

    expect(editorElement.adapter).toBe(customAdapter)
  })

  test("registerAdapter immediately syncs initialized and attributes state", async () => {
    editorElement = await createTestEditor()
    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)

    const initializedPayloads = []
    const attributesPayloads = []
    const customAdapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) {
        initializedPayloads.push(detail)
      },
      dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {
        attributesPayloads.push({ attributes, linkHref, highlight, headingTag })
      },
      freeze() {},
      thaw() {},
      unlinkFrozenNode() {
        return false
      }
    }

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

    const initializedPayloads = []
    const customAdapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) {
        initializedPayloads.push(detail)
      },
      dispatchAttributesChange() {},
      freeze() {},
      thaw() {},
      unlinkFrozenNode() {
        return false
      }
    }

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

    const initialized = []
    const attrs = []
    const adapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) {
        initialized.push(detail)
      },
      dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {
        attrs.push({ attributes, linkHref, highlight, headingTag })
      },
      freeze() {},
      thaw() {},
      unlinkFrozenNode() {
        return false
      }
    }

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

    const initialized = []
    const attrs = []
    const adapter = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) {
        initialized.push(detail)
      },
      dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {
        attrs.push({ attributes, linkHref, highlight, headingTag })
      },
      freeze() {},
      thaw() {},
      unlinkFrozenNode() {
        return false
      }
    }

    editorElement.registerAdapter(adapter)

    expect(initialized).toHaveLength(1)
    expect(attrs).toHaveLength(0)
  })

  test("replacing adapter A with adapter B routes subsequent events only to B", async () => {
    editorElement = await createTestEditor()

    const initializedA = []
    const attrsA = []
    const adapterA = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) {
        initializedA.push(detail)
      },
      dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {
        attrsA.push({ attributes, linkHref, highlight, headingTag })
      },
      freeze() {},
      thaw() {},
      unlinkFrozenNode() {
        return false
      }
    }

    editorElement.registerAdapter(adapterA)

    const initializedABaseline = initializedA.length
    const attrsABaseline = attrsA.length

    await setContent(editorElement, "<p>hello world</p>")
    selectAll(editorElement)
    editorElement.dispatchAttributesChange()

    expect(attrsA.length).toBeGreaterThan(attrsABaseline)
    const attrsAAfterFirstDispatch = attrsA.length
    const initializedAAfterFirstDispatch = initializedA.length

    const initializedB = []
    const attrsB = []
    const adapterB = {
      frozenLinkKey: null,
      dispatchEditorInitialized(detail) {
        initializedB.push(detail)
      },
      dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {
        attrsB.push({ attributes, linkHref, highlight, headingTag })
      },
      freeze() {},
      thaw() {},
      unlinkFrozenNode() {
        return false
      }
    }

    expect(initializedB).toHaveLength(0)
    expect(attrsB).toHaveLength(0)

    editorElement.registerAdapter(adapterB)

    const initializedBBaseline = initializedB.length
    const attrsBBaseline = attrsB.length

    editorElement.dispatchAttributesChange()

    expect(attrsA.length).toBe(attrsAAfterFirstDispatch)
    expect(initializedA.length).toBe(initializedAAfterFirstDispatch)
    expect(attrsB.length).toBeGreaterThan(attrsBBaseline)
    expect(initializedB.length).toBeGreaterThanOrEqual(initializedBBaseline)
  })
})
