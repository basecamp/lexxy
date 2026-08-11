import createDOMPurify from "dompurify"
import { getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"
import Lexxy from "./lexxy"

// Lexxy's own DOMPurify instance, deliberately not the shared default export.
//
// dompurify's default export is a singleton, and both its config and its hooks
// are global to every consumer in the bundle. That makes configuring it from an
// editor's connectedCallback actively dangerous for the host app: DOMPurify
// treats a persistent config as final, so once setConfig() has run, every
// later `sanitize(html, config)` anywhere in the app silently ignores its own
// config argument. An app sanitizing untrusted HTML with, say,
// `{ ALLOW_DATA_ATTR: false }` would keep passing that option and stop getting
// it the moment a Lexxy editor connected — with no error and no visible change
// at the call site.
//
// Calling the default export with a window returns a fresh, independent
// instance. This one carries the hooks and config below; nothing we do here can
// reach the app's instance, and nothing it does can reach ours.
//
// Under Trusted Types, every DOMPurify instance tries to create a policy named
// `dompurify` on its first sanitize, and TT rejects a duplicate name — so the
// second instance on the page gets none. That matters: DOMPurify hands its input
// to DOMParser.parseFromString, which is itself a TT sink, so an unsigned
// instance throws rather than degrading, and which sanitizer breaks depends on
// which one ran first.
//
// So we create our own, under our own name, and hand it to DOMPurify rather than
// letting it try. Guarded, because creating a policy the CSP hasn't allowlisted
// throws: if that happens we're back to no policy, which is exactly where this
// stood before. An app enforcing `require-trusted-types-for 'script'` should add
// `lexxy` to its `trusted-types` directive.
//
// What this does NOT do is make Lexxy work under enforced Trusted Types. It
// stops *our* sanitizer from taking the host's policy name and breaking the
// host's; it does nothing about Lexxy's own unwrapped sinks, and there are
// several. `parseHtml` in helpers/html_helper.js hands a plain string to
// DOMParser.parseFromString on the initial-value path, so the editor throws
// before it finishes connecting — verified in Chromium under
// `require-trusted-types-for 'script'`, with `lexxy` allowlisted and without.
// The `insertAdjacentHTML` in nodes/custom_action_text_attachment_node.js and
// the `innerHTML` writes across elements/ are in the same position. Making the
// editor usable under TT is a separate piece of work; this is a prerequisite
// for it, not the whole of it.
const TRUSTED_TYPES_POLICY = createTrustedTypesPolicy()

function createTrustedTypesPolicy() {
  // Feature-detected below, so browsers without Trusted Types simply get no
  // policy — the same path as a CSP that doesn't allowlist ours.
  // eslint-disable-next-line compat/compat
  const trustedTypes = window.trustedTypes

  if (typeof trustedTypes?.createPolicy !== "function") return null

  try {
    return trustedTypes.createPolicy("lexxy", { createHTML: (html) => html, createScriptURL: (url) => url })
  } catch {
    return null
  }
}

const DOMPurify = createDOMPurify(window)

// alt is inert on every element it can appear on, so it sits in the blanket
// list. srcset is deliberately absent — it carries URLs, so it belongs to a
// consumer that declares it.
const ALLOWED_HTML_ATTRIBUTES = [ "alt", "class", "contenteditable", "href", "src", "style", "title" ]

// width/height are scoped to img rather than allowlisted globally, because
// ALLOWED_ATTR is not per-tag: putting them there would also permit
// `<table width="100000">` and `<td height="500">` in attachment content, which
// is layout the editor previously stripped. An image needs them to hold its
// place while it loads; nothing else here does.
const DEFAULT_TAG_ATTRIBUTES = { img: [ "width", "height" ] }

const ALLOWED_STYLE_PROPERTIES = [ "color", "background-color" ]

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
const URI_BEARING_ATTACHMENT_ATTRIBUTES = [ "url" ]

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

function attachmentUriFilterHook(currentNode, hookEvent) {
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


function styleFilterHook(_currentNode, hookEvent) {
  if (hookEvent.attrName === "style" && hookEvent.attrValue) {
    const styles = { ...getStyleObjectFromCSS(hookEvent.attrValue) }
    const sanitizedStyles = { }

    for (const property in styles) {
      if (ALLOWED_STYLE_PROPERTIES.includes(property)) {
        sanitizedStyles[property] = styles[property]
      }
    }

    if (Object.keys(sanitizedStyles).length) {
      hookEvent.attrValue = getCSSFromStyleObject(sanitizedStyles)
    } else {
      hookEvent.keepAttr = false
    }
  }
}

// DOMPurify's SAFE_FOR_XML guard drops any attribute whose value contains an
// XML-unsafe sequence — a comment terminator (`-->`, `--!>`, `]>`) or a raw
// `</style`-style tag close. Lexxy serializes attachment content (arbitrary HTML,
// including Rails view-annotation comments like `<!-- BEGIN app/views/... -->`)
// into the `content` attribute of an <action-text-attachment>. Under SAFE_FOR_XML
// that value trips the guard and the whole attribute is stripped, silently losing
// the attachment on the storage round-trip.
//
// The content attribute is inert: it is always entity-escaped on serialization and
// is only ever re-parsed — and re-sanitized — by the attachment node's own renderer,
// so preserving it here is mXSS-safe. This regexp mirrors DOMPurify's own
// SAFE_FOR_XML attribute-value check, so it is coupled to the dompurify version in
// package.json — verified identical against 3.4.13's check apart from the /g needed
// for replace().
const XML_UNSAFE_ATTRIBUTE_VALUE =
  /((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/gi

// Narrowed to the attachment element itself, via the same isAttachmentTag the url
// hook uses — both are asking the one question that matters, "is this our element",
// and the answer has to stay the same for both. The justification for the bypass
// below is specific to attachment content: it is entity-escaped on serialization and
// only ever re-parsed by the attachment node's own renderer, which re-sanitizes it.
// Extensions may declare `content` on any tag they like (see home/docs/extensions.md),
// and for `{ tag: "x-widget", attributes: ["content"] }` none of that reasoning holds
// — whatever renders x-widget is free to treat the value as markup.
//
// No fallback to the literal `action-text-attachment`: when a consumer renames the
// element (bc3 uses `bc-attachment`), that name is no longer imported or rendered by
// the attachment node, so exempting it would grant the bypass to a tag nothing here
// treats as an attachment. The configured name is the only one that means anything.
//
// Stateless: the per-editor config arrives as the hook's third argument.
//
// This is the whole reason the hook cannot keep its own copy of which tags allow
// `content`. buildConfig() now runs once per editor, so a module-level set would be
// whichever editor connected last, and it would desynchronise from the config this
// call is actually running under — in both directions. Editor B (attachments off)
// connecting last would strip editor A's content; the reverse would force-keep
// `content` on an element whose in-force config denied it.
//
// DOMPurify passes the resolved config to every hook (`hook.call(DOMPurify, node,
// data, CONFIG)`), and because nothing calls setConfig any more, _parseConfig runs on
// each sanitize() — so CONFIG is this call's config, not a stale one. buildConfig
// already exposes the per-tag predicate as ADD_ATTR, which is exactly the question
// being asked here.
function preserveSerializedContentHook(currentNode, hookEvent, config) {
  const tag = currentNode?.nodeName?.toLowerCase()

  // forceKeepAttr bypasses DOMPurify's per-tag attribute allowlist, so it is scoped
  // to a tag this config actually granted `content` on. Anything else — a
  // non-attachment tag, or an attachment tag configured without `content` because
  // attachments are disabled — falls through to normal validation and is stripped.
  // The bypass never leaks past what the calling editor's config already permits.
  if (hookEvent.attrName === "content" && isAttachmentTag(tag) && config?.ADD_ATTR?.("content", tag)) {
    // Neutralize only the copy DOMPurify inspects for its XML-safety guard. The
    // original value is what reaches the DOM: forceKeepAttr makes _sanitizeAttributes
    // `continue`, which skips the _setAttributeValue at the end of the loop, so the
    // attribute is left exactly as parsed.
    //
    // Replaced with a space rather than an empty string, because deleting a match can
    // join its neighbours into a *new* unsafe sequence that String#replace will not
    // rescan. `foo--</style>bar` collapses to `foo-->bar`, which still trips the guard
    // — and the guard runs before the forceKeepAttr check, so the attribute would be
    // dropped despite this hook. A separator makes that impossible for every
    // alternation in the pattern.
    hookEvent.attrValue = hookEvent.attrValue.replace(XML_UNSAFE_ATTRIBUTE_VALUE, " ")
    hookEvent.forceKeepAttr = true
  }
}

DOMPurify.addHook("uponSanitizeAttribute", styleFilterHook)
DOMPurify.addHook("uponSanitizeAttribute", attachmentUriFilterHook)
// Registered ahead of stimulusAttributeFilterHook, which sets keepAttr = false.
// forceKeepAttr wins over keepAttr in DOMPurify, so if this hook's attribute set
// ever widened past `content` to overlap that one's (`data-controller`,
// `data-action`) it would silently defeat it. They are disjoint today and no test
// links them, so the ordering is noted here rather than left to be rediscovered.
DOMPurify.addHook("uponSanitizeAttribute", preserveSerializedContentHook)

const FORBIDDEN_STIMULUS_ATTRIBUTES = [ "data-controller", "data-action" ]

// Stimulus behavior attributes must never survive sanitization, whatever an
// extension's allowedElements declares. FORBID_ATTR alone isn't enough: in
// DOMPurify 3.x the functional ADD_ATTR — which Lexxy builds from the public
// allowedElements API — is evaluated ahead of FORBID_ATTR, so an extension that
// listed one of these on a tag would otherwise reinstate it. This hook drops
// them unconditionally, keeping the class-level prohibition config-independent.
function stimulusAttributeFilterHook(_currentNode, hookEvent) {
  if (FORBIDDEN_STIMULUS_ATTRIBUTES.includes(hookEvent.attrName)) {
    hookEvent.keepAttr = false
  }
}

DOMPurify.addHook("uponSanitizeAttribute", stimulusAttributeFilterHook)

DOMPurify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName === "strong" || data.tagName === "em") {
    node.removeAttribute("class")
  }
})

export { DOMPurify }

export function buildConfig(allowedElements ) {
  const tagAttributes = {}

  for (const element of allowedElements) {
    if (typeof element === "string") {
      tagAttributes[element] ||= []
    } else {
      tagAttributes[element.tag] ||= []
      tagAttributes[element.tag].push(...element.attributes)
    }
  }

  // Only for tags the caller already permits — this widens what an allowed
  // element may carry, never which elements are allowed.
  for (const [ tag, attributes ] of Object.entries(DEFAULT_TAG_ATTRIBUTES)) {
    if (tagAttributes[tag]) tagAttributes[tag].push(...attributes)
  }

  const config = {
    ALLOWED_TAGS: Object.keys(tagAttributes),
    ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
    ADD_ATTR: (attribute, tag) => tagAttributes[tag]?.includes(attribute),
    ADD_URI_SAFE_ATTR: [ "caption", "filename", ...URI_BEARING_ATTACHMENT_ATTRIBUTES ],
    SAFE_FOR_XML: false, // So that it does not strip attributes that contains serialized HTML (like content)
    // Stimulus behavior attributes must never survive sanitization: they let stored content
    // wire up arbitrary controllers/actions in the viewer's session. FORBID_ATTR wins over
    // ALLOWED_ATTR/ADD_ATTR/ALLOW_DATA_ATTR in DOMPurify, so this holds even though other
    // data-* attributes (data-language, data-trix-*, etc.) are otherwise allowed through.
    FORBID_ATTR: [ "data-controller", "data-action" ]
  }

  // Assigned rather than spread in, because the key has to be absent — not
  // present and undefined — when we have no policy: DOMPurify reads
  // `cfg.TRUSTED_TYPES_POLICY` and validates its shape, so handing it undefined
  // is not the same as leaving it out.
  if (TRUSTED_TYPES_POLICY) {
    config.TRUSTED_TYPES_POLICY = TRUSTED_TYPES_POLICY
  }

  return config
}
