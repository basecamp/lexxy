import { describe, expect, test } from "vitest"
import { DOMPurify, buildConfig } from "src/config/dom_purify"

function sanitizeWith(allowedElements, html) {
  return DOMPurify.sanitize(html, buildConfig(allowedElements))
}

const mention = `<bc-mention gid="gid://bc3/Person/123">@joe</bc-mention>`

// A consumer extension (a mention, say) can carry an identifier whose value uses a
// custom scheme — `gid="gid://…"`. Allowing the attribute name is not enough:
// DOMPurify still runs its scheme check on the value and drops it, because `gid:`
// is not a scheme it recognises. `uriSafeAttributes` is how a caller vouches for
// such an attribute so its value survives, the same exemption `url` already gets.
describe("dom_purify — per-editor uriSafeAttributes", () => {
  test("drops a custom-scheme value when the attribute is only allowed, not URI-safe", () => {
    // Non-vacuity: the name is admitted, so the drop is DOMPurify's scheme check on
    // the value, which is exactly what uriSafeAttributes turns off.
    const sanitized = sanitizeWith([ { tag: "bc-mention", attributes: [ "gid" ] } ], mention)

    expect(sanitized).toContain("bc-mention")
    expect(sanitized).not.toContain("gid=")
  })

  test("keeps the custom-scheme value once the attribute is declared URI-safe", () => {
    const sanitized = sanitizeWith(
      [ { tag: "bc-mention", attributes: [ "gid" ], uriSafeAttributes: [ "gid" ] } ],
      mention
    )

    expect(sanitized).toContain(`gid="gid://bc3/Person/123"`)
  })

  test("case-folds the declared name so it matches DOMPurify's lowercased attribute", () => {
    const sanitized = sanitizeWith(
      [ { tag: "bc-mention", attributes: [ "gid" ], uriSafeAttributes: [ "GID" ] } ],
      mention
    )

    expect(sanitized).toContain(`gid="gid://bc3/Person/123"`)
  })

  test("extends the base exemptions rather than replacing them", () => {
    // A per-editor uriSafeAttribute must not clobber caption/filename/url. Declare
    // both a mention and an attachment url in the same allowlist and confirm each
    // keeps its custom-scheme-free / data: value.
    const html = `<bc-mention gid="gid://bc3/Person/1">@a</bc-mention>` +
      `<action-text-attachment url="data:image/png;base64,iVBORw0KGgo="></action-text-attachment>`
    const sanitized = sanitizeWith([
      { tag: "bc-mention", attributes: [ "gid" ], uriSafeAttributes: [ "gid" ] },
      { tag: "action-text-attachment", attributes: [ "url" ] }
    ], html)

    expect(sanitized).toContain(`gid="gid://bc3/Person/1"`)
    expect(sanitized).toContain("data:image/png;base64,iVBORw0KGgo=")
  })

  test("still refuses an executable scheme on the attachment url beside a URI-safe mention", () => {
    // The new exemption is scoped to the names a caller lists; it does not loosen
    // url's own scheme check.
    const html = `<bc-mention gid="gid://bc3/Person/1">@a</bc-mention>` +
      `<action-text-attachment url="javascript:alert(1)"></action-text-attachment>`
    const sanitized = sanitizeWith([
      { tag: "bc-mention", attributes: [ "gid" ], uriSafeAttributes: [ "gid" ] },
      { tag: "action-text-attachment", attributes: [ "url" ] }
    ], html)

    expect(sanitized).toContain(`gid="gid://bc3/Person/1"`)
    expect(sanitized).not.toContain("javascript:")
  })
})
