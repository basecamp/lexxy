import { afterEach, describe, expect, test } from "vitest"
import { BrowserAdapter } from "../../../src/editor/adapters/browser_adapter"
import { NativeAdapter } from "../../../src/editor/adapters/native_adapter"
import { createTestEditor, destroyTestEditor, selectAll, setContent } from "../unit/helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("BrowserAdapter parity", () => {
  test("has the same methods as NativeAdapter", () => {
    const methodsOf = (adapterClass) => Object.getOwnPropertyNames(adapterClass.prototype).filter(name => name !== "constructor").sort()

    expect(methodsOf(BrowserAdapter)).toEqual(methodsOf(NativeAdapter))
  })

  test("unlinkFrozenNode returns false", () => {
    expect(new BrowserAdapter().unlinkFrozenNode()).toBe(false)
  })

  test("frozenLinkKey starts null", () => {
    expect(new BrowserAdapter().frozenLinkKey).toBeNull()
  })

  test("the editor emits no attributes-change through the default adapter", async () => {
    editorElement = await createTestEditor()
    let fired = 0
    editorElement.addEventListener("lexxy:attributes-change", () => fired++)

    await setContent(editorElement, "<p><strong>hello</strong></p>")
    selectAll(editorElement)
    editorElement.dispatchAttributesChange()

    expect(editorElement.adapter).toBeInstanceOf(BrowserAdapter)
    expect(fired).toBe(0)
  })
})
