import { describe, expect, test } from "vitest"
import { DOMPurify, buildConfig } from "../../../src/config/dom_purify"

function sanitizeWith(allowedElements, html) {
  return DOMPurify.sanitize(html, buildConfig(allowedElements))
}

// alt is what a screen reader reads; width and height are what stop the line
// reflowing while the image loads. Both are inert, and both were being dropped
// from images inside attachment content.
describe("dom_purify — image attributes", () => {
  const richEditor = [ "span", "p", "strong", "img" ]

  test("keeps an image's alternative text and intrinsic size", () => {
    const image = '<img src="/av.png" alt="Joe" width="20" height="20" class="avatar">'

    expect(sanitizeWith(richEditor, image)).toBe(image)
  })

  test("still drops URL-bearing image attributes nobody declared", () => {
    expect(sanitizeWith(richEditor, '<img src="/av.png" srcset="/av2.png 2x">'))
      .toBe('<img src="/av.png">')
  })

  test("scopes an image's size attributes to images", () => {
    const sized = [ "img", "table", "td" ]

    expect(sanitizeWith(sized, '<img src="/a.png" alt="Joe" width="20" height="20">'))
      .toBe('<img src="/a.png" alt="Joe" width="20" height="20">')

    // ALLOWED_ATTR is not per-tag, so a blanket allowlist would have let these
    // through and handed attachment content the editor's layout.
    expect(sanitizeWith(sized, '<table width="100000"><td height="500">x</td></table>'))
      .not.toMatch(/width|height/)
  })

  // The widening applies only to tags the caller already permits.
  test("does not permit an element the caller left out", () => {
    expect(sanitizeWith([ "p" ], '<p>text</p><img src="/a.png" width="20">')).toBe("<p>text</p>")
  })

  test("declared attributes survive only in the object form of allowedElements", () => {
    // A bare tag name declares the element with no attributes of its own, so an
    // identifying attribute is stripped. Consumers that need one — a mention's
    // person id, say — have to declare it.
    expect(sanitizeWith([ "span" ], '<span gid="1">@joe</span>')).toBe("<span>@joe</span>")
    expect(sanitizeWith([ { tag: "span", attributes: [ "gid" ] } ], '<span gid="1">@joe</span>'))
      .toBe('<span gid="1">@joe</span>')
  })
})
