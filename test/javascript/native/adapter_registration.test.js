import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor } from "../helpers/editor_helper"
import { BrowserAdapter } from "../../../src/editor/browser_adapter"

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
      dispatchAttributesChange() {},
      dispatchHighlightColors() {},
      freeze() {},
      thaw() {}
    }

    editorElement.registerAdapter(customAdapter)

    expect(editorElement.adapter).toBe(customAdapter)
  })
})
