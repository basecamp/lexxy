import { describe, expect, test } from "vitest"
import { DOMPurify, buildConfig } from "../../../src/config/dom_purify"

function sanitizeWith(allowedElements, html) {
  return DOMPurify.sanitize(html, buildConfig(allowedElements))
}

const attachment = (url) => `<action-text-attachment content-type="image/*" url="${url}"></action-text-attachment>`
const withUrl = [ { tag: "action-text-attachment", attributes: [ "url", "content-type" ] } ]

// An attachment's `url` becomes an <img src>, so it has to allow the data: URIs
// DOMPurify already allows there — without allowing the schemes it doesn't.
//
// Before dompurify 3.3.2 this attribute skipped URI validation altogether, because
// it is admitted by a functional ADD_ATTR (GHSA-cjmm-f4jc-qw8r). That is what let
// data: URLs through, and javascript: with them. These assert the split the hook
// now draws, which is stricter than what shipped before the fix.
describe("dom_purify — attachment url validation", () => {
  test("keeps the data: URIs an attachment url legitimately carries", () => {
    for (const url of [
      "data:image/png;base64,iVBORw0KGgo=",
      "data:application/pdf;base64,aGVsbG8=",
      "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
      "https://example.com/a.png",
      "/rails/active_storage/blobs/a.png"
    ]) {
      expect(sanitizeWith(withUrl, attachment(url))).toContain(url)
    }
  })

  test("drops an executable scheme from an attachment url", () => {
    for (const url of [ "javascript:alert(1)", "JaVaScRiPt:alert(1)", "vbscript:msgbox(1)" ]) {
      const sanitized = sanitizeWith(withUrl, attachment(url))

      expect(sanitized).not.toContain("url=")
      // The element itself survives — only the attribute is refused.
      expect(sanitized).toContain("action-text-attachment")
    }
  })

  // The hook only ever removes, so scoping stays with the ADD_ATTR predicate.
  test("url is still refused on a tag that never declared it", () => {
    expect(sanitizeWith([ "p" ], '<p url="data:image/png;base64,x">hi</p>')).toBe("<p>hi</p>")
  })
})
