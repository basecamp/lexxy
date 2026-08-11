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
  setSanitizerConfig(editor, [ "span", "p", "strong" ])
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

// The mXSS-safe re-inflation path, across two editors.
//
// SAFE_FOR_XML drops any attribute whose value could close a comment or a raw-text
// element, which is exactly what a serialized `content` attribute looks like — so a
// hook force-keeps it. That bypass has to be scoped to the config of the editor
// making the call, and this is the pair of tests that holds it there.
//
// Both register the *other* editor last on purpose. A hook keeping its own copy of
// which tags allow `content` would hold whichever config was built most recently, and
// each test below catches one direction of that desync: the first loses an
// attachment that should have survived, the second force-keeps `content` on an
// element whose config denied it. Neither shows up without two editors in play,
// which is why single-editor coverage was not enough.
const withContent = [ { tag: "action-text-attachment", attributes: [ "content", "content-type", "sgid" ] } ]
const serialized = '<action-text-attachment content-type="text/html" sgid="x" content="&lt;p title=&quot;--&gt;&quot;&gt;hi&lt;/p&gt;"></action-text-attachment>'

test("safe-XML re-inflation keeps content for the editor whose config allows it", () => {
  const allows = { name: "attachments on" }
  const denies = { name: "attachments off" }

  setSanitizerConfig(allows, withContent)
  setSanitizerConfig(denies, [ "p" ]) // registered last

  // Under module-level state this is the silent data-loss direction: the attachment
  // loses its content and is destroyed on the round trip.
  expect(sanitize(serialized, allows, { safeForXml: true })).toContain("content=")
})

test("safe-XML re-inflation strips content for the editor whose config denies it", () => {
  const denies = { name: "attachments off" }
  const allows = { name: "attachments on" }

  setSanitizerConfig(denies, [ { tag: "action-text-attachment", attributes: [ "content-type", "sgid" ] } ])
  setSanitizerConfig(allows, withContent) // registered last

  // The allowlist-bypass direction: forceKeepAttr skips _isValidAttribute entirely,
  // so a stale gate would keep `content` on an element the in-force config refused.
  const sanitized = sanitize(serialized, denies, { safeForXml: true })

  expect(sanitized).not.toContain("content=\"")
  expect(sanitized).toContain("action-text-attachment")
})

// This also stands in for the version coupling. XML_UNSAFE_ATTRIBUTE_VALUE mirrors
// a check private to DOMPurify, and package.json allows any ^3.4.13, so a later
// release could widen that check and leave our neutralizer behind. Rather than
// pinning an exact version — which would also refuse security patches for the
// dependency this whole file is about — these cases run the real sanitizer end to
// end. If DOMPurify starts rejecting something we do not neutralize, the attribute
// is dropped and this test fails on the version that introduced it.
//
// The values below cover every alternation in the pattern: a comment terminator, a
// bracket terminator, and a raw-text closing tag.
//
// They also cover the merge case. Neutralizing by deletion can join a match's
// neighbours into a *new* unsafe sequence, and String#replace does not rescan what
// it just produced. Deleting `</style` from `foo--</style>bar` leaves `foo-->bar`,
// which still trips the guard — and the guard runs before the forceKeepAttr check,
// so the attribute would be dropped by the very hook meant to keep it.
test("keeps content whose unsafe sequences would merge when removed", () => {
  const merging = { name: "attachments on" }
  setSanitizerConfig(merging, withContent)

  for (const value of [
    "foo--</style>bar", "--</style>>", "a]</title>>b",
    "plain --> comment", "bracket ]> close", "<!-- BEGIN app/views/x --><span>ok</span>",
    "</textarea>", "</noscript>", "--!>"
  ]) {
    const html = `<action-text-attachment content-type="text/html" sgid="x" content="${value.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"></action-text-attachment>`

    expect(sanitize(html, merging, { safeForXml: true }), `lost content for ${value}`)
      .toContain("content=")
  }
})

test("safe-XML mode keeps the per-editor allowlist and the rest of the config", () => {
  const allows = { name: "attachments on" }
  setSanitizerConfig(allows, withContent)

  // Deriving the safe-XML config from a module base rather than this editor's config
  // would drop the allowlist along with everything else buildConfig put in it.
  expect(sanitize("<span>a</span>", allows, { safeForXml: true })).toBe("a")
  expect(sanitize(serialized, allows, { safeForXml: true })).toContain("action-text-attachment")
})

// Every DOMPurify instance claims a policy named `dompurify` under Trusted Types,
// and TT rejects a duplicate — so on a page with a host sanitizer, ours would get
// none, and an unsigned instance throws at DOMParser rather than degrading.
// Ours is created under its own name and handed over, so both work.
test("uses its own Trusted Types policy name", async () => {
  const created = []
  const previous = globalThis.trustedTypes

  globalThis.trustedTypes = {
    createPolicy(name, rules) {
      if (created.includes(name)) throw new TypeError(`Policy "${name}" already exists`)
      created.push(name)
      return { createHTML: rules.createHTML, createScriptURL: rules.createScriptURL }
    },
    getAttributeType: () => null
  }

  try {
    // Re-import so the module-scope policy is created against the stub.
    const fresh = await import(`src/config/dom_purify?tt=${created.length}`)
    const config = fresh.buildConfig([ "b" ])

    expect(created).toContain("lexxy")
    expect(created).not.toContain("dompurify")
    expect(config.TRUSTED_TYPES_POLICY).toBeTruthy()
  } finally {
    globalThis.trustedTypes = previous
  }
})
