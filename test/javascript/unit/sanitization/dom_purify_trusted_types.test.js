import { describe, expect, test, vi } from "vitest"

// The policy is created once, when config/dom_purify is first evaluated, so each
// test installs its stub and then re-imports the module — with a distinct query
// so it gets a fresh instance rather than the one the suite already loaded.
describe("dom_purify — Trusted Types policy", () => {
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
      const fresh = await import("src/config/dom_purify?tt=allowlisted")
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

  // buildConfig carrying the key is only half of it: what matters is that the key
  // is still there in the config an editor's sanitizer actually sanitizes with.
  // buildConfig now runs once per editor, inside EditorSanitizer's constructor, and
  // its result is held privately and handed to DOMPurify.sanitize — so this asserts
  // across that boundary rather than on buildConfig's return value.
  //
  // DOMPurify routes its input through createHTML, so the recorded call is the
  // evidence. It has to be recorded *per policy name*: with no policy in the config
  // DOMPurify asks for one of its own, so a stub that recorded regardless of name
  // would see the call either way and prove nothing. resetModules is what lets the
  // whole chain — sanitizer, dom_purify, the policy — be built against the stub.
  // The fallback sanitizer declares no allowlist at all, and still has to carry
  // the policy. Without it DOMPurify asks the browser for one of its own on our
  // instance, under the `dompurify` name — the collision this exists to avoid,
  // reached by nothing more than an unregistered consumer sanitizing first.
  // That is why the key is assigned in buildConfig rather than alongside the
  // allowlist it derives.
  test("a sanitizer with no allowlist still sanitizes through the lexxy policy", async () => {
    const trusted = []
    const previous = globalThis.trustedTypes

    globalThis.trustedTypes = {
      createPolicy(name, rules) {
        return {
          createHTML(html) {
            trusted.push([ name, html ])
            return rules.createHTML(html)
          },
          createScriptURL: rules.createScriptURL
        }
      },
      getAttributeType: () => null
    }

    try {
      vi.resetModules()
      const { default: EditorSanitizer } = await import("src/editor/sanitizer")

      // Never registered, so this resolves to the fallback.
      expect(EditorSanitizer.for({}).sanitize("<b>hi</b>")).toBe("<b>hi</b>")
      expect(trusted).toContainEqual([ "lexxy", "<b>hi</b>" ])
    } finally {
      globalThis.trustedTypes = previous
      vi.resetModules()
    }
  })

  test("an editor's sanitizer sanitizes through the lexxy policy", async () => {
    const trusted = []
    const previous = globalThis.trustedTypes

    globalThis.trustedTypes = {
      createPolicy(name, rules) {
        return {
          createHTML(html) {
            trusted.push([ name, html ])
            return rules.createHTML(html)
          },
          createScriptURL: rules.createScriptURL
        }
      },
      getAttributeType: () => null
    }

    try {
      vi.resetModules()
      const { default: EditorSanitizer } = await import("src/editor/sanitizer")
      const sanitizer = EditorSanitizer.register({ _htmlConversions: new Map() }, [ "b" ])

      expect(sanitizer.sanitize("<b>hi</b><script>x()</script>")).toBe("<b>hi</b>")
      expect(trusted).toContainEqual([ "lexxy", "<b>hi</b><script>x()</script>" ])
    } finally {
      globalThis.trustedTypes = previous
      vi.resetModules()
    }
  })
})
