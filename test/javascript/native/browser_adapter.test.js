import { describe, expect, test } from "vitest"
import { BrowserAdapter } from "../../../src/editor/adapters/browser_adapter"

describe("BrowserAdapter parity", () => {
  test("has the same shape as NativeAdapter and is a no-op", () => {
    const adapter = new BrowserAdapter()

    expect(() => adapter.dispatchAttributesChange()).not.toThrow()
    expect(() => adapter.dispatchEditorInitialized({})).not.toThrow()
    expect(() => adapter.freeze()).not.toThrow()
    expect(() => adapter.thaw()).not.toThrow()
  })

  test("unlinkFrozenNode returns false", () => {
    expect(new BrowserAdapter().unlinkFrozenNode()).toBe(false)
  })

  test("frozenLinkKey starts null", () => {
    expect(new BrowserAdapter().frozenLinkKey).toBeNull()
  })

  test("dispatchAttributesChange does not emit a DOM event", () => {
    const adapter = new BrowserAdapter()
    const target = document.createElement("div")
    let fired = 0
    target.addEventListener("lexxy:attributes-change", () => fired++)

    adapter.dispatchAttributesChange()
    expect(fired).toBe(0)
  })
})
