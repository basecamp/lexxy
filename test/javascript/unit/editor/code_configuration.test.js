import { expect, test } from "vitest"
import { createElement } from "../helpers/dom_helper"
import EditorConfiguration from "src/editor/configuration"
import { configure } from "src/index"

configure({
  default: {
    codeBlocks: true,
    inlineCode: true
  },
  noCode: {
    codeBlocks: false,
    inlineCode: false
  },
  fallbackToDefault: {
  }
})

test("uses default code options", () => {
  const element = createElement("<lexxy-editor></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("codeBlocks")).toBe(true)
  expect(config.get("inlineCode")).toBe(true)
})

test("uses preset code options", () => {
  const element = createElement("<lexxy-editor preset='noCode'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("codeBlocks")).toBe(false)
  expect(config.get("inlineCode")).toBe(false)
})

test("overrides code blocks via element attribute", () => {
  const element = createElement(`<lexxy-editor code-blocks="false"></lexxy-editor>`)
  const config = new EditorConfiguration(element)
  expect(config.get("codeBlocks")).toBe(false)
  expect(config.get("inlineCode")).toBe(true)
})

test("overrides inline code via element attribute", () => {
  const element = createElement(`<lexxy-editor inline-code="false"></lexxy-editor>`)
  const config = new EditorConfiguration(element)
  expect(config.get("inlineCode")).toBe(false)
  expect(config.get("codeBlocks")).toBe(true)
})

test("preset falls back to default code options", () => {
  const element = createElement("<lexxy-editor preset='fallbackToDefault'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("codeBlocks")).toBe(true)
  expect(config.get("inlineCode")).toBe(true)
})
