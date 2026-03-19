import { expect, test } from "vitest"
import { sanitize } from "src/helpers/sanitization_helper"

const allowedElements = { time: ["datetime"], abbr: true, blockquote: false }

test("preserves tag with scoped attributes", () => {
  expect(sanitize('<p>Meet at <time datetime="2026-03-19">Thursday</time></p>', allowedElements))
    .toContain('<time datetime="2026-03-19">Thursday</time>')
})

test("strips attributes not in the scoped or global list", () => {
  expect(sanitize('<p><time datetime="2026-03-19" tabindex="0">Thursday</time></p>', allowedElements))
    .toContain('<time datetime="2026-03-19">Thursday</time>')
})

test("preserves tag added with true", () => {
  expect(sanitize("<p>An <abbr>HTML</abbr> element</p>", allowedElements))
    .toContain("<abbr>HTML</abbr>")
})

test("forbids default tags set to false", () => {
  expect(sanitize("<blockquote>A quote</blockquote>", allowedElements))
    .not.toContain("blockquote")
})

test("strips unconfigured tags", () => {
  const result = sanitize("<p>Hello <blink>world</blink></p>", allowedElements)
  expect(result).not.toContain("blink")
  expect(result).toContain("Hello world")
})
