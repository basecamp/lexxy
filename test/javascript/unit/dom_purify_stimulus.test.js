import { describe, expect, test } from "vitest"
import { DOMPurify, buildConfig } from "../../../src/config/dom_purify"

function sanitizeWith(allowedElements, html) {
  return DOMPurify.sanitize(html, buildConfig(allowedElements))
}

describe("dom_purify — Stimulus behavior attribute stripping", () => {
  test("strips data-controller/data-action under the default config", () => {
    const out = sanitizeWith(
      [ "div" ],
      '<div data-controller="content-loader" data-action="click->content-loader#load">hi</div>'
    )

    expect(out).not.toContain("data-controller")
    expect(out).not.toContain("data-action")
  })

  // Regression for the ADD_ATTR bypass: an extension declaring a Stimulus
  // attribute via allowedElements makes buildConfig's functional ADD_ATTR return
  // truthy for it, which in DOMPurify 3.x is evaluated before FORBID_ATTR. The
  // uponSanitizeAttribute hook must still remove it.
  test("strips them even when an extension declares them via allowedElements", () => {
    const out = sanitizeWith(
      [ { tag: "div", attributes: [ "data-controller", "data-action" ] } ],
      '<div data-controller="content-loader" data-action="click->content-loader#load">hi</div>'
    )

    expect(out).not.toContain("data-controller")
    expect(out).not.toContain("data-action")
  })

  test("preserves other data-* attributes such as data-language (no over-strip)", () => {
    const out = sanitizeWith(
      [ { tag: "pre", attributes: [ "data-language" ] } ],
      '<pre data-language="ruby">code</pre>'
    )

    expect(out).toContain('data-language="ruby"')
  })
})
