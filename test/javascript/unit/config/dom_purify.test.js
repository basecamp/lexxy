import { expect, test } from "vitest"
import { DOMPurify, buildConfig } from "src/config/dom_purify"
import { setSanitizerConfig } from "src/helpers/sanitization_helper"

test("buildConfig exposes allowed tags on the config object", () => {
  const { config } = buildConfig([ "p", "strong" ])
  expect(config.ALLOWED_TAGS).toEqual([ "p", "strong" ])
})

test("buildConfig returns hooks alongside config", () => {
  const { hooks } = buildConfig([ "p" ])
  expect(typeof hooks.uponSanitizeAttribute).toBe("function")
  expect(typeof hooks.uponSanitizeElement).toBe("function")
})

test("keeps default style properties when allowedStyles is omitted", () => {
  setSanitizerConfig([ "p" ])
  const sanitized = DOMPurify.sanitize('<p style="color: red; font-weight: bold;">x</p>')
  expect(sanitized).toContain("color: red")
  expect(sanitized).not.toContain("font-weight")
})

test("allowedStyles extends the default style allowlist", () => {
  setSanitizerConfig([ "p" ], [ "font-weight", "text-align" ])
  const sanitized = DOMPurify.sanitize('<p style="font-weight: bold; text-align: center; line-height: 2;">x</p>')
  expect(sanitized).toContain("font-weight: bold")
  expect(sanitized).toContain("text-align: center")
  expect(sanitized).not.toContain("line-height")
})

test("text-align is not allowed by default", () => {
  setSanitizerConfig([ "p" ])
  const sanitized = DOMPurify.sanitize('<p style="text-align: center;">x</p>')
  expect(sanitized).not.toContain("text-align")
})

test("rebuilding without extra styles restores the default allowlist", () => {
  setSanitizerConfig([ "p" ], [ "font-weight" ])
  setSanitizerConfig([ "p" ])
  const sanitized = DOMPurify.sanitize('<p style="font-weight: bold; color: red;">x</p>')
  expect(sanitized).not.toContain("font-weight")
  expect(sanitized).toContain("color: red")
})

test("strips class attribute from strong/em via uponSanitizeElement hook", () => {
  setSanitizerConfig([ "strong", "em" ])
  const sanitized = DOMPurify.sanitize('<strong class="bold">x</strong><em class="italic">y</em>')
  expect(sanitized).not.toContain("class")
})

test("preserves host-registered DOMPurify hooks across reconfiguration", () => {
  let externalHookCalls = 0
  const externalHook = () => { externalHookCalls++ }
  DOMPurify.addHook("uponSanitizeElement", externalHook)

  try {
    setSanitizerConfig([ "p" ])
    DOMPurify.sanitize("<p>hello</p>")
    expect(externalHookCalls).toBeGreaterThan(0)
  } finally {
    DOMPurify.removeHook("uponSanitizeElement", externalHook)
  }
})
