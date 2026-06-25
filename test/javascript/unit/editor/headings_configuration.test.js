import { expect, test } from "vitest"
import { createElement } from "../helpers/dom_helper"
import EditorConfiguration from "src/editor/configuration"
import { configure } from "src/index"

configure({
  default: {
    headings: [ "h2", "h3", "h4" ]
  },
  blogPost: {
    headings: [ "h1", "h2", "h3" ]
  },
  noHeadings: {
    headings: []
  }
})

test("uses default headings", () => {
  const element = createElement("<lexxy-editor></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("headings")).toEqual([ "h2", "h3", "h4" ])
})

test("uses preset headings", () => {
  const element = createElement("<lexxy-editor preset='blogPost'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("headings")).toEqual([ "h1", "h2", "h3" ])
})

test("overrides headings via element attribute", () => {
  const element = createElement(`<lexxy-editor headings='["h2", "h3"]'></lexxy-editor>`)
  const config = new EditorConfiguration(element)
  expect(config.get("headings")).toEqual([ "h2", "h3" ])
})

test("disables headings with empty array", () => {
  const element = createElement("<lexxy-editor preset='noHeadings'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("headings")).toEqual([])
})

test("preset falls back to default headings", () => {
  const element = createElement("<lexxy-editor preset='blogPost'></lexxy-editor>")
  const config = new EditorConfiguration(element)
  expect(config.get("headings")).toEqual([ "h1", "h2", "h3" ])
})
