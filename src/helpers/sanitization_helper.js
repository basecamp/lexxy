import Lexxy from "../config/lexxy"

// An attachment's `url` ends up as an <img src> (action_text_attachment_node
// reads it into `this.src`, which is assigned to img.src). DOMPurify already
// permits a data: URI on img[src] — img is in its DATA_URI_TAGS — but it has no
// way to know that a custom element's `url` feeds the same sink, so it applies
// the plain URI check and drops it.
//
// Until 3.3.2 that never came up: attributes admitted by a *functional* ADD_ATTR
// skipped URI validation entirely (GHSA-cjmm-f4jc-qw8r), which is how data:
// URLs worked here — and, less happily, how `url="javascript:…"` survived too.
// The fix restored validation for both.
//
// So `url` is marked URI-safe, which hands the decision to this hook. The hook
// only ever removes an attribute — it never force-keeps one — so scoping stays
// with the ADD_ATTR predicate, and a `url` on a tag that never declared it is
// dropped as it always was.
//
// The data: exception is scoped to the attachment element, not to the attribute
// name. ADD_URI_SAFE_ATTR is attribute-name-wide: it takes `url` out of
// DOMPurify's URI checking on every tag, not just ours. Extensions may declare
// arbitrary attributes on arbitrary tags — home/docs/extensions.md's own worked
// example is an <iframe> — so an extension declaring `url` would otherwise
// inherit an exception granted because *an attachment's* url becomes an img src.
// Nothing about a third party's element supports that, and `data:text/html` in a
// navigational sink is script execution. Everything else gets the standard
// policy, which is what it would have had if we had never touched `url`.
//
// That argument is about an attribute feeding a URL sink, not about
// ADD_URI_SAFE_ATTR as such. The inert text attributes beside `url` in that list
// — `caption`, `filename` — keep the attribute-name-wide exemption, and need it:
// ordinary prose like "Q4: results" is not a URI any regex here would accept.
export const URI_BEARING_ATTACHMENT_ATTRIBUTES = [ "url" ]

// DOMPurify's own IS_ALLOWED_URI scheme list, reproduced rather than narrowed, so
// `url` on a non-attachment tag is treated exactly as DOMPurify would have treated
// it. Kept as a source string so allowedUriRegexp() can widen it with an editor's
// declared schemes without re-deriving the rest of the pattern.
const BASE_URI_SCHEMES = "(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix"

// Builds DOMPurify's default IS_ALLOWED_URI, optionally with extra schemes folded
// into the scheme alternation. Widening the recognised-safe scheme set is how a
// custom-scheme identifier (a mention's `gid://…`) passes validation without
// exempting any attribute from it — so javascript:/data: stay refused on every
// attribute, including href and object[data]. Passing no schemes reproduces
// DOMPurify's default exactly.
export function allowedUriRegexp(extraSchemes = []) {
  // Only real scheme names, regexp-escaped, so a caller can't inject pattern
  // syntax through the scheme list.
  const extra = extraSchemes
    .map(scheme => String(scheme).toLowerCase())
    .filter(scheme => /^[a-z][a-z0-9+.-]*$/.test(scheme))
    .map(scheme => scheme.replace(/[.+-]/g, "\\$&"))

  const schemes = [ BASE_URI_SCHEMES, ...extra ].join("|")

  return new RegExp(`^(?:(?:${schemes}):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))`, "i")
}

const ALLOWED_URI = allowedUriRegexp()

// eslint-disable-next-line no-control-regex -- mirrors DOMPurify's own ATTR_WHITESPACE
const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g

// Tested against the value as given, never the whitespace-stripped copy, so a
// scheme smuggled at a nonzero offset is refused. DOMPurify draws the same line:
// its data: allowance is a prefix test on the un-stripped value, which is why
// this is a second step rather than one more scheme in ALLOWED_URI.
//
// One deliberate difference from DOMPurify's img[src] handling remains, stated
// because the earlier claim of matching it "exactly" was not true: DOMPurify
// tests for a literal lowercase `data:` and this is case-insensitive, so `DATA:`
// passes here too. That matches how browsers resolve schemes, which is what
// actually decides whether the URL loads.
const ATTACHMENT_DATA_URI = /^data:/i

function isAttachmentTag(tag) {
  return tag === Lexxy.global.get("attachmentTagName")
}

export function attachmentUriFilterHook(currentNode, hookEvent) {
  if (!URI_BEARING_ATTACHMENT_ATTRIBUTES.includes(hookEvent.attrName)) return

  // DOMPurify keeps an empty value — its chain ends `else if (value) { return
  // false } else ;` — while every alternation here needs at least one character.
  if (!hookEvent.attrValue) return

  const value = String(hookEvent.attrValue)

  if (ALLOWED_URI.test(value.replace(ATTR_WHITESPACE, ""))) return
  if (isAttachmentTag(currentNode?.nodeName?.toLowerCase()) && ATTACHMENT_DATA_URI.test(value)) return

  hookEvent.keepAttr = false
}
