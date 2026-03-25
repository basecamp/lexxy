import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, selectAll, setContent } from "../unit/helpers/editor_helper"
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
      dispatchAttributesChange(attributes, linkHref, highlight) {
        attributesPayloads.push({ attributes, linkHref, highlight })
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
    expect(attributesPayloads).toHaveLength(1)
    expect(attributesPayloads[0].attributes).toBeTruthy()
  })
})
