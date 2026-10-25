import { expect, test } from "vitest"
import { createElement } from "../helpers/dom_helper"
import EditorConfiguration from "src/editor/configuration"
import { configure } from "src/index"

configure({
  noTables: {
    tables: false
  },
  fallbackToDefault: {
  }
})

test("enables tables by default", () => {
  const element = createElement("<lexxy-editor></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("tables")).toBe(true)
})

test("uses the preset tables option", () => {
  const element = createElement("<lexxy-editor preset='noTables'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("tables")).toBe(false)
})

test("overrides tables via element attribute", () => {
  const element = createElement("<lexxy-editor tables='false'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("tables")).toBe(false)
})

test("preset falls back to the default tables option", () => {
  const element = createElement("<lexxy-editor preset='fallbackToDefault'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("tables")).toBe(true)
})
