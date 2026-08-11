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

// The regression this change exists for, at attribute rather than tag level.
//
// "each editor keeps its own allowlist" above only varies *tags*, so a
// per-editor rule about an *attribute* could still be shared or misapplied
// without failing anything. `content` is the attribute that matters: it carries
// the attachment's serialized markup, so losing it destroys the attachment on
// the round trip rather than merely trimming it.
//
// Both cases register the *other* editor last on purpose. Under the module-level
// config this replaced, the last editor to connect decided for every editor on
// the page, and each direction below catches one half of that: the first loses an
// attachment that should have survived, the second keeps `content` on an element
// whose own config denied it.
const ATTACHMENT = '<action-text-attachment sgid="x" content-type="text/html" content="&lt;span&gt;hi&lt;/span&gt;"></action-text-attachment>'
const ALLOWS_CONTENT = [ { tag: "action-text-attachment", attributes: [ "content", "content-type", "sgid" ] } ]
const DENIES_CONTENT = [ { tag: "action-text-attachment", attributes: [ "content-type", "sgid" ] } ]

test("an editor allowing attachment content keeps it when another editor denies it", () => {
  const allows = { name: "attachments on" }
  const denies = { name: "attachments off" }

  setSanitizerConfig(allows, ALLOWS_CONTENT)
  setSanitizerConfig(denies, DENIES_CONTENT) // registered last

  expect(sanitize(ATTACHMENT, allows)).toContain("content=")
})

test("an editor denying attachment content strips it when another editor allows it", () => {
  const denies = { name: "attachments off" }
  const allows = { name: "attachments on" }

  setSanitizerConfig(denies, DENIES_CONTENT)
  setSanitizerConfig(allows, ALLOWS_CONTENT) // registered last

  const sanitized = sanitize(ATTACHMENT, denies)

  expect(sanitized).not.toContain("content=\"")
  // Only the attribute is refused — the element itself is still allowed here.
  expect(sanitized).toContain("action-text-attachment")
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

// The other two shapes the policy can land in. Creating a policy the CSP has not
// allowlisted throws, and that throw is caught — so the interesting assertion is
// not just "no crash" but that the config comes back with the key *absent*.
// DOMPurify reads cfg.TRUSTED_TYPES_POLICY and validates its shape, so a present
// -but-undefined key is not the same as an omitted one.
test("falls back to no policy when the CSP refuses the name", async () => {
  const previous = globalThis.trustedTypes
  let asked = false

  globalThis.trustedTypes = {
    createPolicy(name) {
      asked = true
      throw new TypeError(`Refused to create a TrustedTypePolicy named '${name}'`)
    },
    getAttributeType: () => null
  }

  try {
    const fresh = await import("src/config/dom_purify?tt=refused")
    const config = fresh.buildConfig([ "b" ])

    expect(asked, "should have attempted to create its own policy").toBe(true)
    expect(config).not.toHaveProperty("TRUSTED_TYPES_POLICY")
    // Still sanitizes — this is the position Lexxy was in before it asked at all.
    expect(fresh.DOMPurify.sanitize("<b>hi</b><script>x()</script>", config)).toBe("<b>hi</b>")
  } finally {
    globalThis.trustedTypes = previous
  }
})

test("asks for no policy in a browser without Trusted Types", async () => {
  const previous = globalThis.trustedTypes
  delete globalThis.trustedTypes

  try {
    const fresh = await import("src/config/dom_purify?tt=absent")
    const config = fresh.buildConfig([ "b" ])

    expect(config).not.toHaveProperty("TRUSTED_TYPES_POLICY")
    expect(fresh.DOMPurify.sanitize("<b>hi</b><script>x()</script>", config)).toBe("<b>hi</b>")
  } finally {
    globalThis.trustedTypes = previous
  }
})
