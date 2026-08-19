import { afterEach, describe, expect, test } from "vitest"
import { DOMPurify, buildConfig } from "src/config/dom_purify"
import Lexxy from "src/config/lexxy"

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

  // This is the hook's guard, and the only one. `url` is in ADD_URI_SAFE_ATTR, so
  // DOMPurify does not validate it at all — delete the hook and leave that entry
  // in place, which is the likeliest way this gets half-removed, and this is the
  // assertion that fails. (Reverting both instead moves the failure to the data:
  // case above, where DOMPurify's plain check refuses what the hook allowed.)
  test("drops an executable scheme from an attachment url", () => {
    for (const url of [ "javascript:alert(1)", "JaVaScRiPt:alert(1)", "vbscript:msgbox(1)" ]) {
      const sanitized = sanitizeWith(withUrl, attachment(url))

      expect(sanitized).not.toContain("url=")
      // The element itself survives — only the attribute is refused.
      expect(sanitized).toContain("action-text-attachment")
    }
  })

  // The data: allowance is a prefix test on the value as given, matching
  // DOMPurify's own. Stripping ATTR_WHITESPACE first instead would let a control
  // character carry the scheme past offset zero — `new URL()` still resolves this
  // one to protocol "data:", and DOMPurify refuses the same string on an img[src].
  test("refuses a data: scheme hidden behind a leading control character", () => {
    const sanitized = sanitizeWith(withUrl, attachment("\u0001data:text/html,<script>alert(1)</script>"))

    expect(sanitized).not.toContain("data:")
    expect(sanitized).toContain("action-text-attachment")
  })

  // DOMPurify keeps an empty value rather than refusing it — its check chain ends
  // `else if (value) { return false } else ;` — and the hook has to agree, since
  // what it rests on is that a `url` is treated exactly as DOMPurify would treat
  // it. Values are trimmed before a hook sees them, so a whitespace-only url
  // arrives empty too.
  test("keeps an empty url, as DOMPurify keeps an empty img src", () => {
    for (const url of [ "", "   " ]) {
      expect(sanitizeWith(withUrl, attachment(url))).toContain('url=""')
    }
  })

  // The hook only ever removes, so scoping stays with the ADD_ATTR predicate.
  test("url is still refused on a tag that never declared it", () => {
    expect(sanitizeWith([ "p" ], '<p url="data:image/png;base64,x">hi</p>')).toBe("<p>hi</p>")
  })

  // ADD_URI_SAFE_ATTR is attribute-name-wide, so without scoping by tag the data:
  // exception granted to an attachment url reaches every extension that declares
  // `url` on an element of its own — whose sink may be an iframe or a navigation
  // rather than an img src, where data:text/html is script execution.
  describe("the data: exception is the attachment element's, not the attribute name's", () => {
    const extension = [ { tag: "x-widget", attributes: [ "url" ] } ]

    test("an extension's url does not inherit it", () => {
      const sanitized = sanitizeWith(extension, '<x-widget url="data:text/html,<script>alert(1)</script>"></x-widget>')

      expect(sanitized).not.toContain("data:")
      // Only the attribute is refused; the element an extension declared survives.
      expect(sanitized).toContain("x-widget")
    })

    test("an extension's url keeps the schemes DOMPurify would have allowed anyway", () => {
      for (const url of [ "https://example.com/a", "/rails/active_storage/blobs/a.png", "mailto:joe@example.com" ]) {
        expect(sanitizeWith(extension, `<x-widget url="${url}"></x-widget>`)).toContain(url)
      }
    })

    test("an extension's url still refuses an executable scheme", () => {
      expect(sanitizeWith(extension, '<x-widget url="javascript:alert(1)"></x-widget>')).not.toContain("javascript:")
    })

    // Control: the attachment element is the one that keeps it.
    test("the attachment element still keeps its data: urls", () => {
      expect(sanitizeWith(withUrl, attachment("data:image/png;base64,iVBORw0KGgo=")))
        .toContain("data:image/png;base64,iVBORw0KGgo=")
    })
  })

  // The scoping follows the *configured* attachment tag, not the literal
  // action-text-attachment string — which is the whole point of reading it from
  // the global. bc3 renames the element to bc-attachment, so this is that
  // consumer's real path, and getting it wrong fails in one of two silent ways:
  // bc3's avatars (data: urls on bc-attachment) get stripped, or a stray
  // action-text-attachment keeps a data: exception it should no longer have.
  describe("scoping follows the configured attachment tag name", () => {
    const renamed = (tag, url) => `<${tag} content-type="image/*" url="${url}"></${tag}>`
    const original = Lexxy.global.get("attachmentTagName")

    afterEach(() => Lexxy.global.merge({ attachmentTagName: original }))

    test("a renamed attachment element keeps its data: urls", () => {
      Lexxy.global.merge({ attachmentTagName: "bc-attachment" })

      const config = [ { tag: "bc-attachment", attributes: [ "url", "content-type" ] } ]
      expect(sanitizeWith(config, renamed("bc-attachment", "data:image/png;base64,iVBORw0KGgo=")))
        .toContain("data:image/png;base64,iVBORw0KGgo=")
    })

    test("the old name loses the exception once it is no longer the configured tag", () => {
      Lexxy.global.merge({ attachmentTagName: "bc-attachment" })

      // action-text-attachment is now just some element, so its url gets the
      // standard policy — data: is refused, the element is kept.
      const config = [ { tag: "action-text-attachment", attributes: [ "url", "content-type" ] } ]
      const sanitized = sanitizeWith(config, renamed("action-text-attachment", "data:text/html,<b>x</b>"))

      expect(sanitized).not.toContain("data:")
      expect(sanitized).toContain("action-text-attachment")
    })
  })
})
