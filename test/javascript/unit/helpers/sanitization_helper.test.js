import { beforeEach, expect, test } from "vitest"
import DOMPurify from "dompurify"
import { sanitize, setSanitizerConfig } from "src/helpers/sanitization_helper"

// Lexxy must not configure the DOMPurify singleton the host app also imports.
//
// DOMPurify treats a persistent config as final: after setConfig(), every later
// sanitize(html, config) ignores its config argument. Lexxy configures its
// sanitizer when an editor connects, so if that ran against the shared instance
// it would silently disarm the app's own sanitizing — options the app is still
// passing, and still relying on, would stop applying with no error anywhere.
//
// These assert isolation in both directions against the real singleton. The
// config is keyed by editor, but nothing here depends on it being a real
// Lexical editor — any identity will do.

const DIRTY = '<span data-controller="evil" class="keep">hi</span>'
const editor = { name: "stand-in for a Lexical editor" }

beforeEach(() => {
  DOMPurify.clearConfig()
  setSanitizerConfig(editor, [ "span", "p", "strong", "img" ])
})

test("configuring Lexxy's sanitizer leaves the app's per-call config working", () => {
  // The app's call still gets exactly what it asked for.
  expect(DOMPurify.sanitize(DIRTY, { ALLOW_DATA_ATTR: false }))
    .toBe('<span class="keep">hi</span>')

  // Control: the option is what's doing the work, so this test can't pass
  // because something else happened to strip data-*.
  expect(DOMPurify.sanitize(DIRTY, {})).toContain("data-controller")
})

test("the app's persistent config does not reach into Lexxy's sanitizing", () => {
  DOMPurify.setConfig({ ALLOWED_TAGS: [ "b" ], ALLOWED_ATTR: [] })

  expect(sanitize('<span class="keep">hi</span>', editor)).toBe('<span class="keep">hi</span>')
})

test("Lexxy's hooks are not installed on the shared instance", () => {
  // The style filter hook in config/dom_purify would rewrite this to color
  // only, dropping the disallowed property.
  expect(DOMPurify.sanitize('<p style="color: red; position: fixed">x</p>', { ALLOWED_ATTR: [ "style" ] }))
    .toContain("position")
})

test("sanitize applies the configured allowlist", () => {
  expect(sanitize("<span>keep</span><script>evil()</script>", editor)).toBe("<span>keep</span>")
})

test("each editor keeps its own allowlist", () => {
  const other = { name: "a second editor" }
  setSanitizerConfig(other, [ "strong" ])

  expect(sanitize("<span>a</span><strong>b</strong>", editor)).toBe("<span>a</span><strong>b</strong>")
  expect(sanitize("<span>a</span><strong>b</strong>", other)).toBe("a<strong>b</strong>")
})

test("declared attributes survive only in the object form of allowedElements", () => {
  // A bare tag name declares the element with no attributes of its own, so an
  // identifying attribute is stripped. Consumers that need one — a mention's
  // person id, say — have to declare it.
  const bare = { name: "bare" }
  const declared = { name: "declared" }
  setSanitizerConfig(bare, [ "span" ])
  setSanitizerConfig(declared, [ { tag: "span", attributes: [ "gid" ] } ])

  expect(sanitize('<span gid="1">@joe</span>', bare)).toBe("<span>@joe</span>")
  expect(sanitize('<span gid="1">@joe</span>', declared)).toBe('<span gid="1">@joe</span>')
})

test("keeps an image's alternative text and intrinsic size", () => {
  const image = '<img src="/av.png" alt="Joe" width="20" height="20" class="avatar">'

  expect(sanitize(image, editor)).toBe(image)
})

test("still drops URL-bearing image attributes nobody declared", () => {
  expect(sanitize('<img src="/av.png" srcset="/av2.png 2x">', editor))
    .toBe('<img src="/av.png">')
})

test("scopes an image's size attributes to images", () => {
  const sized = { name: "sized" }
  setSanitizerConfig(sized, [ "img", "table", "td" ])

  expect(sanitize('<img src="/a.png" alt="Joe" width="20" height="20">', sized))
    .toBe('<img src="/a.png" alt="Joe" width="20" height="20">')

  // ALLOWED_ATTR is not per-tag, so a blanket allowlist would have let these
  // through and handed attachment content the editor's layout.
  expect(sanitize('<table width="100000"><td height="500">x</td></table>', sized))
    .not.toMatch(/width|height/)
})

test("does not permit an element the caller left out", () => {
  const noImages = { name: "no-images" }
  setSanitizerConfig(noImages, [ "p" ])

  expect(sanitize('<p>text</p><img src="/a.png" width="20">', noImages)).toBe("<p>text</p>")
})
