import { describe, expect, test } from "vitest"
import { DOMPurify, buildConfig } from "src/config/dom_purify"

function sanitizeWith(allowedElements, html) {
  return DOMPurify.sanitize(html, buildConfig(allowedElements))
}

const mention = `<bc-mention gid="gid://bc3/Person/123">@joe</bc-mention>`

// A consumer element can carry an identifier whose value uses a custom scheme —
// `gid="gid://…"`. Allowing the attribute name is not enough: DOMPurify runs its
// scheme check on the value and drops it, because it doesn't recognise `gid:`.
// uriSafeSchemes folds the scheme into the editor's URI allowlist so the value
// survives — while javascript:/data: stay refused on every attribute, since no
// attribute is exempted from validation.
describe("dom_purify — per-editor uriSafeSchemes", () => {
  test("drops a custom-scheme value when the scheme isn't declared", () => {
    // Non-vacuity: the name is admitted, so the drop is DOMPurify's scheme check,
    // which is exactly what declaring the scheme relaxes.
    const sanitized = sanitizeWith([ { tag: "bc-mention", attributes: [ "gid" ] } ], mention)

    expect(sanitized).toContain("bc-mention")
    expect(sanitized).not.toContain("gid=")
  })

  test("keeps the custom-scheme value once the scheme is declared", () => {
    const sanitized = sanitizeWith(
      [ { tag: "bc-mention", attributes: [ "gid" ], uriSafeSchemes: [ "gid" ] } ],
      mention
    )

    expect(sanitized).toContain(`gid="gid://bc3/Person/123"`)
  })

  test("case-folds the declared scheme", () => {
    const sanitized = sanitizeWith(
      [ { tag: "bc-mention", attributes: [ "gid" ], uriSafeSchemes: [ "GID" ] } ],
      mention
    )

    expect(sanitized).toContain(`gid="gid://bc3/Person/123"`)
  })

  test("still refuses javascript: on href, even when a custom scheme is declared", () => {
    // The point of widening schemes rather than exempting attributes: declaring
    // gid does not open href to an executable scheme anywhere.
    const sanitized = sanitizeWith(
      [ { tag: "a", attributes: [ "href" ], uriSafeSchemes: [ "gid" ] } ],
      `<a href="javascript:alert(1)">x</a>`
    )

    expect(sanitized).not.toContain("javascript:")
  })

  test("still refuses data:text/html on object[data], even with a custom scheme declared", () => {
    // The gap that drove this design: a name-wide attribute exemption would have
    // let this through; widening only the gid scheme does not.
    const sanitized = sanitizeWith(
      [ { tag: "object", attributes: [ "data" ], uriSafeSchemes: [ "gid" ] } ],
      `<object data="data:text/html,<script>alert(1)</script>">x</object>`
    )

    expect(sanitized).not.toContain("data:text/html")
  })

  test("refuses to admit an executable scheme, even when declared", () => {
    // A caller can't turn javascript:/data:/vbscript: into a recognised-safe
    // scheme — DOMPurify does not re-block a scheme its ALLOWED_URI_REGEXP accepts,
    // so admitting one would let it survive on href/object[data]. These are dropped
    // from the declared set.
    for (const [ scheme, html, needle ] of [
      [ "javascript", `<a href="javascript:alert(1)">x</a>`, "javascript:" ],
      [ "vbscript", `<a href="vbscript:msgbox(1)">x</a>`, "vbscript:" ],
      [ "data", `<object data="data:text/html,<script>alert(1)</script>">x</object>`, "data:text/html" ]
    ]) {
      const sanitized = sanitizeWith(
        [ { tag: "a", attributes: [ "href" ] }, { tag: "object", attributes: [ "data" ], uriSafeSchemes: [ scheme ] } ],
        html
      )
      expect(sanitized, `${scheme} should not be admitted`).not.toContain(needle)
    }
  })

  test("ignores a scheme carrying regexp metacharacters", () => {
    // The scheme is folded into a RegExp source, so a value that isn't a real
    // scheme name is dropped rather than injected as pattern syntax.
    const sanitized = sanitizeWith(
      [ { tag: "a", attributes: [ "href" ], uriSafeSchemes: [ "java.*script" ] } ],
      `<a href="javascript:alert(1)">x</a>`
    )

    expect(sanitized).not.toContain("javascript:")
  })

  test("leaves the built-in exemptions intact alongside a declared scheme", () => {
    const html = mention +
      `<action-text-attachment url="data:image/png;base64,iVBORw0KGgo="></action-text-attachment>`
    const sanitized = sanitizeWith([
      { tag: "bc-mention", attributes: [ "gid" ], uriSafeSchemes: [ "gid" ] },
      { tag: "action-text-attachment", attributes: [ "url" ] }
    ], html)

    expect(sanitized).toContain(`gid="gid://bc3/Person/123"`)
    expect(sanitized).toContain("data:image/png;base64,iVBORw0KGgo=")
  })

  test("still refuses an executable scheme on the attachment url beside a declared scheme", () => {
    const html = mention +
      `<action-text-attachment url="javascript:alert(1)"></action-text-attachment>`
    const sanitized = sanitizeWith([
      { tag: "bc-mention", attributes: [ "gid" ], uriSafeSchemes: [ "gid" ] },
      { tag: "action-text-attachment", attributes: [ "url" ] }
    ], html)

    expect(sanitized).toContain(`gid="gid://bc3/Person/123"`)
    expect(sanitized).not.toContain("javascript:")
  })
})
