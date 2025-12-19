import { expect, test, vi } from "vitest"
import EditorConfiguration from "../../editor/configuration"
import lexxyConfig from "../../config/lexxy"

test("uses defaults", () => {
  lexxyConfig.presets.merge({
    default: { singleLine: true }
  })

  const c = new EditorConfiguration({
    preset: "default",
    hasAttribute: () => false,
  })
  expect(c.get("singleLine")).toBe(true)
})

test("overrides defaults", () => {
  const c = new EditorConfiguration({
    preset: "default",
    hasAttribute: () => true,
    getAttribute: () => "false",
  })
  expect(c.get("toolbar")).toBe(false)
})

test("uses preset", () => {
  lexxyConfig.presets.merge({
    simple: { toolbar: false }
  })

  const c = new EditorConfiguration({
    preset: "simple",
    hasAttribute: () => false,
  })
  expect(c.get("toolbar")).toBe(false)
})
