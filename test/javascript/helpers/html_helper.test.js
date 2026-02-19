import { expect, test } from "vitest"
import { addBlockSpacers, parseHtml } from "../../../src/helpers/html_helper"

function transform(html) {
  const doc = parseHtml(html)
  addBlockSpacers(doc)
  return doc.body.innerHTML
}

test("inserts spacer between adjacent paragraphs", () => {
  expect(transform("<p>One</p><p>Two</p>")).toBe("<p>One</p><p><br></p><p>Two</p>")
})

test("does not insert spacer after a heading", () => {
  expect(transform("<h1>Title</h1><p>Text</p>")).toBe("<h1>Title</h1><p>Text</p>")
})

test("does not insert spacer after any heading level", () => {
  expect(transform("<h2>Title</h2><p>Text</p>")).toBe("<h2>Title</h2><p>Text</p>")
  expect(transform("<h3>Title</h3><p>Text</p>")).toBe("<h3>Title</h3><p>Text</p>")
  expect(transform("<h6>Title</h6><p>Text</p>")).toBe("<h6>Title</h6><p>Text</p>")
})

test("inserts spacer before a heading when preceded by a non-heading", () => {
  expect(transform("<p>Text</p><h2>Title</h2>")).toBe("<p>Text</p><p><br></p><h2>Title</h2>")
})

test("inserts spacers between multiple paragraphs", () => {
  expect(transform("<p>One</p><p>Two</p><p>Three</p>"))
    .toBe("<p>One</p><p><br></p><p>Two</p><p><br></p><p>Three</p>")
})

test("inserts spacer around list blocks", () => {
  expect(transform("<p>Intro</p><ul><li>item</li></ul><p>Outro</p>"))
    .toBe("<p>Intro</p><p><br></p><ul><li>item</li></ul><p><br></p><p>Outro</p>")
})

test("handles mixed heading and paragraph content", () => {
  expect(transform("<h1>Title</h1><p>First</p><p>Second</p><h2>Sub</h2><p>Third</p>"))
    .toBe("<h1>Title</h1><p>First</p><p><br></p><p>Second</p><p><br></p><h2>Sub</h2><p>Third</p>")
})

test("does nothing with a single element", () => {
  expect(transform("<p>Only</p>")).toBe("<p>Only</p>")
})

test("does nothing with empty input", () => {
  expect(transform("")).toBe("")
})
