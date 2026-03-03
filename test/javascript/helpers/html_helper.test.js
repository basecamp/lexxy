import { expect, test } from "vitest"
import { addBlockSpacing, parseHtml } from "../../../src/helpers/html_helper"

function bodyHtml(doc) {
  return doc.body.innerHTML
}

test("inserts spacing between two paragraphs", () => {
  const doc = parseHtml("<p>a</p><p>b</p>")
  addBlockSpacing(doc)
  expect(bodyHtml(doc)).toBe("<p>a</p><p><br></p><p>b</p>")
})

test("inserts spacing between multiple elements", () => {
  const doc = parseHtml("<p>a</p><p>b</p><p>c</p>")
  addBlockSpacing(doc)
  expect(bodyHtml(doc)).toBe("<p>a</p><p><br></p><p>b</p><p><br></p><p>c</p>")
})

test("does not insert spacing after headings", () => {
  const doc = parseHtml("<h2>Title</h2><p>text</p>")
  addBlockSpacing(doc)
  expect(bodyHtml(doc)).toBe("<h2>Title</h2><p>text</p>")
})

test("does not insert spacing after any heading level", () => {
  const doc = parseHtml("<h1>One</h1><p>a</p><h3>Three</h3><p>b</p><h6>Six</h6><p>c</p>")
  addBlockSpacing(doc)
  expect(bodyHtml(doc)).toBe("<h1>One</h1><p>a</p><p><br></p><h3>Three</h3><p>b</p><p><br></p><h6>Six</h6><p>c</p>")
})

test("inserts spacing before headings when preceding element is not a heading", () => {
  const doc = parseHtml("<p>a</p><h2>Title</h2>")
  addBlockSpacing(doc)
  expect(bodyHtml(doc)).toBe("<p>a</p><p><br></p><h2>Title</h2>")
})

test("does not insert spacing with a single element", () => {
  const doc = parseHtml("<p>only</p>")
  addBlockSpacing(doc)
  expect(bodyHtml(doc)).toBe("<p>only</p>")
})

test("handles empty document body", () => {
  const doc = parseHtml("")
  addBlockSpacing(doc)
  expect(bodyHtml(doc)).toBe("")
})

test("handles mixed headings and non-headings", () => {
  const doc = parseHtml("<h1>Title</h1><p>intro</p><p>body</p><h2>Subtitle</h2><p>more</p>")
  addBlockSpacing(doc)
  expect(bodyHtml(doc)).toBe("<h1>Title</h1><p>intro</p><p><br></p><p>body</p><p><br></p><h2>Subtitle</h2><p>more</p>")
})

test("does not add trailing spacer", () => {
  const doc = parseHtml("<p>a</p><p>b</p>")
  addBlockSpacing(doc)
  expect(doc.body.lastElementChild.innerHTML).toBe("b")
})

test("only operates on top-level children, not nested elements", () => {
  const doc = parseHtml("<ul><li>one</li><li>two</li></ul><p>after</p>")
  addBlockSpacing(doc)
  expect(bodyHtml(doc)).toBe("<ul><li>one</li><li>two</li></ul><p><br></p><p>after</p>")
})

test("does not add leading spacer", () => {
  const doc = parseHtml("<p>a</p><p>b</p>")
  addBlockSpacing(doc)
  expect(doc.body.firstElementChild.innerHTML).toBe("a")
})
