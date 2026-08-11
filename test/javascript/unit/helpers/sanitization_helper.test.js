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
