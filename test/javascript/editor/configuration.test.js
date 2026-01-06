import { expect, test } from "vitest"
import { createElement } from "../helpers/dom_helper"
import EditorConfiguration from "../../../src/editor/configuration"
import { configure } from "../../../src/index"

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
  const config = EditorConfiguration.for(element)
  expect(config.attachments).toBe(true)
})

test("uses preset", () => {
  const element = createElement("<lexxy-editor preset='simple'></lexxy-editor>")
  const config = EditorConfiguration.for(element)
  expect(config.toolbar).toBe(false)
})

test("preset fallbacks to default", () => {
  const element = createElement("<lexxy-editor preset='simple'></lexxy-editor>")
  const config = EditorConfiguration.for(element)
  expect(config.attachments).toBe(true)
})

test("overrides defaults", () => {
  const element = createElement("<lexxy-editor toolbar='false'></lexxy-editor>")
  const config = EditorConfiguration.for(element)
  expect(config.toolbar).toBe(false)
})
