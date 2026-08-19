import { afterEach, describe, expect, test, vi } from "vitest"

// The policy is resolved at most once per module instance, so each test installs
// its stub and then re-imports the module through resetModules to get a fresh
// one — otherwise it would see whatever the first test in the file resolved.
describe("dom_purify — Trusted Types policy", () => {
  const previousTrustedTypes = globalThis.trustedTypes

  afterEach(() => {
    globalThis.trustedTypes = previousTrustedTypes
    vi.resetModules()
  })

  // Records every policy the module asks the browser for, and every string signed
  // through one, tagged with the name that signed it. `refuse` is the name the CSP
  // does not allowlist.
  function stubTrustedTypes({ refuse = null } = {}) {
    const created = []
    const signed = []

    globalThis.trustedTypes = {
      createPolicy(name, rules) {
        if (name === refuse) throw new TypeError(`Refused to create a TrustedTypePolicy named '${name}'`)
        if (created.includes(name)) throw new TypeError(`Policy "${name}" already exists`)
        created.push(name)

        return {
          createHTML(html) {
            signed.push([ name, html ])
            return rules.createHTML(html)
          },
          createScriptURL: rules.createScriptURL
        }
      },
      getAttributeType: () => null
    }

    return { created, signed }
  }

  async function freshModule(path) {
    vi.resetModules()
    return import(path)
  }

  // Every DOMPurify instance claims a policy named `dompurify` under Trusted Types,
  // and TT rejects a duplicate — so on a page with a host sanitizer, ours would get
  // none, and an unsigned instance silently returns an empty string. Ours is created
  // under its own name and handed over, so both work.
  //
  // The sanitize() call is the assertion, not decoration: DOMPurify creates its own
  // default policy lazily inside _parseConfig, so a `not.toContain("dompurify")`
  // check on a config that was never sanitized with cannot fail.
  test("signs through its own Trusted Types policy name, and never asks for dompurify", async () => {
    const { created, signed } = stubTrustedTypes()

    const fresh = await freshModule("src/config/dom_purify")
    const config = fresh.buildConfig([ "b" ])

    expect(fresh.DOMPurify.sanitize("<b>hi</b><script>x()</script>", config)).toBe("<b>hi</b>")
    expect(created).toEqual([ "lexxy" ])
    expect(signed).toContainEqual([ "lexxy", "<b>hi</b><script>x()</script>" ])
    expect(config.TRUSTED_TYPES_POLICY).toBeTruthy()
  })

  // The policy is resolved on the first buildConfig, not at import. Under enforced
  // Trusted Types without `lexxy` allowlisted, resolving it at import would report a
  // CSP violation on every page load of an app that imports Lexxy — src/index.js
  // exports both this module and EditorSanitizer — and never renders an editor.
  test("asks for no policy until something builds a config", async () => {
    const { created } = stubTrustedTypes()

    const fresh = await freshModule("src/config/dom_purify")
    expect(created).toEqual([])

    fresh.buildConfig([ "b" ])
    expect(created).toEqual([ "lexxy" ])
  })

  // EditorSanitizer's fallback is the other import-time trap, and the one that
  // actually loads on a page: built as a static field initializer it would run
  // buildConfig while the module evaluated, and src/index.js exports the class.
  test("asks for no policy when only the sanitizer module is imported", async () => {
    const { created } = stubTrustedTypes()

    const { default: EditorSanitizer } = await freshModule("src/editor/sanitizer")
    expect(created).toEqual([])

    EditorSanitizer.for({}).sanitize("<b>hi</b>")
    expect(created).toEqual([ "lexxy" ])
  })

  // Creating a policy the CSP has not allowlisted throws, and that throw is caught.
  // The interesting assertion is not "no crash" but that we then sanitize with *no*
  // policy rather than letting DOMPurify pick one: with the key omitted it falls
  // through to its own default and asks for `dompurify`, which is the name this
  // whole thing exists to leave alone. So the stub refuses only `lexxy` and would
  // happily grant `dompurify` — and the created list has to come back empty.
  test("falls back to no policy at all when the CSP refuses the name", async () => {
    const { created, signed } = stubTrustedTypes({ refuse: "lexxy" })

    const fresh = await freshModule("src/config/dom_purify")
    const config = fresh.buildConfig([ "b" ])

    // Still sanitizes — this is the position Lexxy was in before it asked at all.
    expect(fresh.DOMPurify.sanitize("<b>hi</b><script>x()</script>", config)).toBe("<b>hi</b>")
    expect(created).toEqual([])
    expect(signed).toEqual([])
    // Null, not absent. An absent key is what sends DOMPurify to its own default.
    expect(config).toHaveProperty("TRUSTED_TYPES_POLICY", null)
  })

  test("asks for no policy in a browser without Trusted Types", async () => {
    delete globalThis.trustedTypes

    const fresh = await freshModule("src/config/dom_purify")
    const config = fresh.buildConfig([ "b" ])

    expect(config).toHaveProperty("TRUSTED_TYPES_POLICY", null)
    expect(fresh.DOMPurify.sanitize("<b>hi</b><script>x()</script>", config)).toBe("<b>hi</b>")
  })

  // buildConfig carrying the key is only half of it: what matters is that the key
  // is still there in the config an editor's sanitizer actually sanitizes with.
  // buildConfig runs once per editor, inside EditorSanitizer's constructor, and its
  // result is held privately and handed to DOMPurify.sanitize — so this asserts
  // across that boundary rather than on buildConfig's return value.
  //
  // The signed name is the evidence, and it has to be recorded per name: with no
  // policy in the config DOMPurify asks for one of its own, so a stub that recorded
  // regardless of name would see the call either way and prove nothing.
  test("an editor's sanitizer sanitizes through the lexxy policy", async () => {
    const { created, signed } = stubTrustedTypes()

    const { default: EditorSanitizer } = await freshModule("src/editor/sanitizer")
    const sanitizer = EditorSanitizer.register({ _htmlConversions: new Map() }, [ "b" ])

    expect(sanitizer.sanitize("<b>hi</b><script>x()</script>")).toBe("<b>hi</b>")
    expect(created).toEqual([ "lexxy" ])
    expect(signed).toContainEqual([ "lexxy", "<b>hi</b><script>x()</script>" ])
  })

  // The fallback sanitizer declares no allowlist at all, and still has to carry the
  // policy. Without it DOMPurify asks the browser for one of its own on our
  // instance, under the `dompurify` name — the collision this exists to avoid,
  // reached by nothing more than an unregistered consumer sanitizing first. That is
  // why the key is assigned in buildConfig rather than alongside the allowlist it
  // derives.
  test("a sanitizer with no allowlist still sanitizes through the lexxy policy", async () => {
    const { created, signed } = stubTrustedTypes()

    const { default: EditorSanitizer } = await freshModule("src/editor/sanitizer")

    // Never registered, so this resolves to the fallback.
    expect(EditorSanitizer.for({}).sanitize("<b>hi</b>")).toBe("<b>hi</b>")
    expect(created).toEqual([ "lexxy" ])
    expect(signed).toContainEqual([ "lexxy", "<b>hi</b>" ])
  })

  // One policy for the whole module, reused across every editor and every call. The
  // stub throws on a duplicate name, exactly as Trusted Types does, so re-resolving
  // it per editor or per sanitize would land the second one in the no-policy
  // fallback — and only some of these strings would come back signed.
  test("reuses the one policy across editors and repeated sanitizes", async () => {
    const { created, signed } = stubTrustedTypes()

    const { default: EditorSanitizer } = await freshModule("src/editor/sanitizer")
    const rich = EditorSanitizer.register({ _htmlConversions: new Map() }, [ "b", "i" ])
    const plain = EditorSanitizer.register({ _htmlConversions: new Map() }, [ "b" ])

    for (const round of [ 1, 2, 3 ]) {
      expect(rich.sanitize(`<b>${round}</b><i>x</i>`)).toBe(`<b>${round}</b><i>x</i>`)
      expect(plain.sanitize(`<b>${round}</b><i>x</i>`)).toBe(`<b>${round}</b>x`)
    }

    // DOMPurify signs an empty string of its own on every parse, for the value it
    // returns when the input has no body, so only the markup is counted here.
    const signedMarkup = signed.filter(([ , html ]) => html !== "")

    expect(created).toEqual([ "lexxy" ])
    expect(signedMarkup).toHaveLength(6)
    expect(signedMarkup.map(([ name ]) => name)).toEqual(Array(6).fill("lexxy"))
  })
})
