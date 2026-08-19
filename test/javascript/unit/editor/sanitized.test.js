import { beforeEach, expect, test } from "vitest"
import DOMPurify from "dompurify"
import SanitizedEditor from "src/editor/sanitized"

// Lexxy must not configure the DOMPurify singleton the host app also imports.
//
// DOMPurify treats a persistent config as final: after setConfig(), every later
// sanitize(html, config) ignores its config argument. Lexxy configures its
// sanitizer when an editor connects, so if that ran against the shared instance
// it would silently disarm the app's own sanitizing — options the app is still
// passing, and still relying on, would stop applying with no error anywhere.
//
// These assert isolation in both directions against the real singleton. A
// sanitizer is built around a Lexical editor, but nothing here reads it: only
// `value` does, so any identity will do as a stand-in.

const DIRTY = '<span data-controller="evil" class="keep">hi</span>'
const editor = { name: "stand-in for a Lexical editor" }

let sanitized

beforeEach(() => {
  DOMPurify.clearConfig()
  sanitized = new SanitizedEditor(editor)
  sanitized.allowedTags = [ "span", "p", "strong" ]
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

  expect(sanitized.sanitize('<span class="keep">hi</span>')).toBe('<span class="keep">hi</span>')
})

test("Lexxy's hooks are not installed on the shared instance", () => {
  // The style filter hook in config/dom_purify would rewrite this to color
  // only, dropping the disallowed property.
  expect(DOMPurify.sanitize('<p style="color: red; position: fixed">x</p>', { ALLOWED_ATTR: [ "style" ] }))
    .toContain("position")
})

test("sanitizing applies the editor's allowlist", () => {
  expect(sanitized.sanitize("<span>keep</span><script>evil()</script>")).toBe("<span>keep</span>")
})

// The remaining tests resolve the sanitizer with for(), the way a node does from
// createDOM()'s editor argument. That lookup is what keeps an editor's allowlist
// its own, so exercising it is the point rather than incidental.
test("each editor keeps its own allowlist", () => {
  const other = { name: "a second editor" }
  new SanitizedEditor(other).allowedTags = [ "strong" ]

  expect(SanitizedEditor.for(editor).sanitize("<span>a</span><strong>b</strong>")).toBe("<span>a</span><strong>b</strong>")
  expect(SanitizedEditor.for(other).sanitize("<span>a</span><strong>b</strong>")).toBe("a<strong>b</strong>")
})

// The regression this change exists for, at attribute rather than tag level.
//
// "each editor keeps its own allowlist" above only varies *tags*, so a
// per-editor rule about an *attribute* could still be shared or misapplied
// without failing anything. `content` is the attribute that matters: it carries
// the attachment's serialized markup, so losing it destroys the attachment on
// the round trip rather than merely trimming it.
//
// Both cases configure the *other* editor last on purpose. Under the module-level
// config this replaced, the last editor to connect decided for every editor on
// the page, and each direction below catches one half of that: the first loses an
// attachment that should have survived, the second keeps `content` on an element
// whose own allowlist denied it.
const ATTACHMENT = '<action-text-attachment sgid="x" content-type="text/html" content="&lt;span&gt;hi&lt;/span&gt;"></action-text-attachment>'
const ALLOWS_CONTENT = [ { tag: "action-text-attachment", attributes: [ "content", "content-type", "sgid" ] } ]
const DENIES_CONTENT = [ { tag: "action-text-attachment", attributes: [ "content-type", "sgid" ] } ]

test("an editor allowing attachment content keeps it when another editor denies it", () => {
  const allows = { name: "attachments on" }
  const denies = { name: "attachments off" }

  new SanitizedEditor(allows).allowedTags = ALLOWS_CONTENT
  new SanitizedEditor(denies).allowedTags = DENIES_CONTENT // configured last

  expect(SanitizedEditor.for(allows).sanitize(ATTACHMENT)).toContain("content=")
})

test("an editor denying attachment content strips it when another editor allows it", () => {
  const denies = { name: "attachments off" }
  const allows = { name: "attachments on" }

  new SanitizedEditor(denies).allowedTags = DENIES_CONTENT
  new SanitizedEditor(allows).allowedTags = ALLOWS_CONTENT // configured last

  const result = SanitizedEditor.for(denies).sanitize(ATTACHMENT)

  expect(result).not.toContain("content=\"")
  // Only the attribute is refused — the element itself is still allowed here.
  expect(result).toContain("action-text-attachment")
})
