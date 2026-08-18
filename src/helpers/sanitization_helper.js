import { DOMPurify, buildConfig } from "../config/dom_purify"
import Lexxy from "../config/lexxy"

export function setSanitizerConfig(allowedTags) {
  DOMPurify.clearConfig()
  DOMPurify.setConfig(buildConfig(allowedTags))
}

export function sanitize(html) {
  return DOMPurify.sanitize(html)
}

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
export const URI_BEARING_ATTACHMENT_ATTRIBUTES = [ "url" ]

// DOMPurify's own IS_ALLOWED_URI, reproduced rather than narrowed, so `url` on a
// non-attachment tag is treated exactly as DOMPurify would have treated it.
const ALLOWED_URI = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i

// The same list plus data:, for the attachment element only.
//
// One deliberate difference from DOMPurify's img[src] handling, stated because
// the earlier claim of matching it "exactly" was not true: DOMPurify tests for a
// literal lowercase `data:` at offset zero, and this is case-insensitive, so
// `DATA:` passes here too. That matches how browsers resolve schemes, which is
// what actually decides whether the URL loads.
const ALLOWED_ATTACHMENT_URI = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i
// eslint-disable-next-line no-control-regex -- mirrors DOMPurify's own ATTR_WHITESPACE
const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g

function isAttachmentTag(tag) {
  return tag === Lexxy.global.get("attachmentTagName")
}

export function attachmentUriFilterHook(currentNode, hookEvent) {
  if (!URI_BEARING_ATTACHMENT_ATTRIBUTES.includes(hookEvent.attrName)) return

  let permitted
  if (isAttachmentTag(currentNode?.nodeName?.toLowerCase())) {
    permitted = ALLOWED_ATTACHMENT_URI
  } else {
    permitted = ALLOWED_URI
  }

  if (!permitted.test(String(hookEvent.attrValue).replace(ATTR_WHITESPACE, ""))) {
    hookEvent.keepAttr = false
  }
}
