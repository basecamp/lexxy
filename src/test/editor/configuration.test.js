import { expect, test } from "vitest"
import { createElement } from "../dom_helper"
import EditorConfiguration from "../../editor/configuration"
import { configure } from "../../index"

configure({
  default: {
    toolbar: true,
    attachments: true
  },
  simple: {
    toolbar: false
  }
})

test("uses defaults", () => {
  const element = createElement("<lexxy-editor></lexxy-editor>")
  const config = new EditorConfiguration(element, "default")
  expect(config.get("attachments")).toBe(true)
})

test("uses preset", () => {
  const element = createElement("<lexxy-editor></lexxy-editor>")
  const config = new EditorConfiguration(element, "simple")
  expect(config.get("toolbar")).toBe(false)
})

test("preset fallbacks to default", () => {
  const element = createElement("<lexxy-editor></lexxy-editor>")
  const config = new EditorConfiguration(element, "simple")
  expect(config.get("attachments")).toBe(true)
})

test("overrides defaults", () => {
  const element = createElement("<lexxy-editor toolbar='false'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("toolbar")).toBe(false)
})
