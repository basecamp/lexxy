import { expect, test } from "vitest"
import { DOMPurify, buildConfig } from "src/config/dom_purify"

function configure(allowedElements, allowedStyles) {
  DOMPurify.clearConfig()
  DOMPurify.setConfig(buildConfig(allowedElements, allowedStyles))
}

test("buildConfig exposes allowed tags", () => {
  const config = buildConfig([ "p", "strong" ])
  expect(config.ALLOWED_TAGS).toEqual([ "p", "strong" ])
})

test("keeps default style properties when allowedStyles is omitted", () => {
  configure([ "p" ])
  const sanitized = DOMPurify.sanitize('<p style="color: red; font-weight: bold;">x</p>')
  expect(sanitized).toContain("color: red")
  expect(sanitized).not.toContain("font-weight")
})

test("allowedStyles extends the default style allowlist", () => {
  configure([ "p" ], [ "font-weight", "text-align" ])
  const sanitized = DOMPurify.sanitize('<p style="font-weight: bold; text-align: center; line-height: 2;">x</p>')
  expect(sanitized).toContain("font-weight: bold")
  expect(sanitized).toContain("text-align: center")
  expect(sanitized).not.toContain("line-height")
})

test("text-align is not allowed by default", () => {
  configure([ "p" ])
  const sanitized = DOMPurify.sanitize('<p style="text-align: center;">x</p>')
  expect(sanitized).not.toContain("text-align")
})

test("rebuilding without extra styles restores the default allowlist", () => {
  configure([ "p" ], [ "font-weight" ])
  configure([ "p" ])
  const sanitized = DOMPurify.sanitize('<p style="font-weight: bold; color: red;">x</p>')
  expect(sanitized).not.toContain("font-weight")
  expect(sanitized).toContain("color: red")
})
