import { expect, test, vi } from "vitest"
import { createElement } from "../helpers/dom_helper"
import EditorConfiguration from "src/editor/configuration"
import { configure } from "src/index"

configure({
  default: {
    richText: true,
    attachments: true
  },
  simple: {
    richText: false
  }
})

test("uses defaults", () => {
  const element = createElement("<lexxy-editor></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("attachments")).toBe(true)
})

test("uses preset", () => {
  const element = createElement("<lexxy-editor preset='simple'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("richText")).toBe(false)
})

test("preset fallbacks to default", () => {
  const element = createElement("<lexxy-editor preset='simple'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("attachments")).toBe(true)
})

test("overrides defaults", () => {
  const element = createElement("<lexxy-editor rich-text='false'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("richText")).toBe(false)
})

test("unknown preset falls back to defaults with a warning", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  const element = createElement("<lexxy-editor preset='missing' rich-text='false'></lexxy-editor>")
  const config = new EditorConfiguration(element)

  expect(config.get("attachments")).toBe(true)
  expect(config.get("richText")).toBe(false)
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown Lexxy preset "missing"'))

  warn.mockRestore()
})
