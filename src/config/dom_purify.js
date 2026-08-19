import createDOMPurify from "dompurify"
import { getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"
import { URI_BEARING_ATTACHMENT_ATTRIBUTES, attachmentUriFilterHook } from "../helpers/sanitization_helper"

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
// second instance on the page gets none. That matters, and not because it throws:
// DOMPurify hands its input to DOMParser.parseFromString, which is itself a TT
// sink, but `_initDocument` swallows that throw and the innerHTML throw from its
// createDocument fallback, and `sanitize` then returns "" for the body it never
// got. An unsigned instance silently drops all content, with nothing in the host's
// error tracker to say why — and which sanitizer goes silent depends on which one
// ran first.
//
// So we create our own, under our own name, and hand it to DOMPurify rather than
// letting it try. Lazily, because resolving it at import would fire a CSP
// violation report on every page load of an app that imports Lexxy and never
// renders an editor, and at most once, because TT throws on a duplicate name.
// Guarded too, because creating a policy the CSP hasn't allowlisted throws: if
// that happens we're back to no policy, which is exactly where this stood before.
// An app enforcing `require-trusted-types-for 'script'` should add `lexxy` to its
// `trusted-types` directive.
//
// What this does NOT do is make Lexxy work under enforced Trusted Types. It
// stops *our* sanitizer from taking the host's policy name and breaking the
// host's; it does nothing about Lexxy's own unwrapped sinks, and there are
// several. `parseHtml` in helpers/html_helper.js hands a plain string to
// DOMParser.parseFromString on the initial-value path, so the editor throws
// before it finishes connecting — verified in Chromium under
// `require-trusted-types-for 'script'`, with `lexxy` allowlisted and without.
// `createElement` in the same file is a second sink in it, writing its `content`
// argument through innerHTML for the two callers that pass one — the wrapped-table
// figure and the table tools' count. `highlightElement` in
// helpers/code_highlighting_helper.js writes Prism's output the same way, and both
// it and highlightCode are exported from src/index.js — so that one throws for a
// host app calling Lexxy's highlighting API directly, outside any editor. The
// `insertAdjacentHTML` in nodes/custom_action_text_attachment_node.js and the
// `innerHTML` writes across elements/ — the toolbar, the dropdowns, the node
// delete button — are in the same position. Making the editor usable under TT is a
// separate piece of work; this is a prerequisite for it, not the whole of it.
let trustedTypesPolicyResolved = false
let resolvedTrustedTypesPolicy = null

function trustedTypesPolicy() {
  if (!trustedTypesPolicyResolved) {
    resolvedTrustedTypesPolicy = createTrustedTypesPolicy()
    trustedTypesPolicyResolved = true
  }

  return resolvedTrustedTypesPolicy
}

function createTrustedTypesPolicy() {
  // Feature-detected below, so browsers without Trusted Types simply get no
  // policy — the same path as a CSP that doesn't allowlist ours.
  // eslint-disable-next-line compat/compat
  const trustedTypes = window.trustedTypes

  if (typeof trustedTypes?.createPolicy !== "function") return null

  try {
    return trustedTypes.createPolicy("lexxy", { createHTML: (html) => html, createScriptURL: (url) => url })
  } catch {
    // Warned rather than swallowed, matching what DOMPurify does when its own
    // policy is refused. The fallback is a silent loss of Trusted Types coverage
    // otherwise, and the CSP violation report alone doesn't name us.
    console.warn("TrustedTypes policy lexxy could not be created.")
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

// Navigational/URL attributes an editor may never declare URI-safe: their values
// reach a navigation, submission, or resource-load sink where a javascript:/data:
// scheme executes or loads. See uriSafeAttributes handling in allowlistFor.
const NEVER_URI_SAFE = [ "href", "src", "xlink:href", "action", "formaction" ]

const ALLOWED_STYLE_PROPERTIES = [ "color", "background-color" ]

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

DOMPurify.addHook("uponSanitizeAttribute", styleFilterHook)
DOMPurify.addHook("uponSanitizeAttribute", attachmentUriFilterHook)

const FORBIDDEN_STIMULUS_ATTRIBUTES = [ "data-controller", "data-action" ]

// Stimulus behavior attributes must never survive sanitization, whatever an
// extension's allowedElements declares. On dompurify 3.4.13 FORBID_ATTR already
// carries that on its own: _isValidAttribute opens with it, ahead of the
// functional ADD_ATTR Lexxy builds from the public allowedElements API. So this
// hook is defence in depth rather than the barrier, and it is kept because it
// holds without reference to the config — the prohibition is a class-level one,
// and a FORBID_ATTR entry lives or dies with whatever rebuilds the config.
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

// Called with no allowedElements for a sanitizer that has no allowlist to apply,
// which is not the same thing as an empty one — see EditorSanitizer's fallback.
export function buildConfig(allowedElements = null) {
  const config = {
    ADD_URI_SAFE_ATTR: [ "caption", "filename", ...URI_BEARING_ATTACHMENT_ATTRIBUTES ],
    SAFE_FOR_XML: false, // So that it does not strip attributes that contains serialized HTML (like content)
    // Stimulus behavior attributes must never survive sanitization: they let stored content
    // wire up arbitrary controllers/actions in the viewer's session. FORBID_ATTR wins over
    // ALLOWED_ATTR/ADD_ATTR/ALLOW_DATA_ATTR in DOMPurify, so this holds even though other
    // data-* attributes (data-language, data-trix-*, etc.) are otherwise allowed through.
    FORBID_ATTR: [ "data-controller", "data-action" ]
  }

  // Left out rather than emptied when there is no allowlist, so DOMPurify's own
  // default tag and attribute policy stands. `ALLOWED_TAGS: []` would not be a
  // default, it would be a refusal: it strips every tag. An editor that declares
  // an empty allowlist still gets that refusal, because it asked for it.
  //
  // uriSafeAttributes is pulled out and appended rather than assigned: it extends
  // the base ADD_URI_SAFE_ATTR above (caption/filename/url), where an Object.assign
  // would replace it and drop those.
  if (allowedElements) {
    const { uriSafeAttributes, ...tagPolicy } = allowlistFor(allowedElements)
    config.ADD_URI_SAFE_ATTR.push(...uriSafeAttributes)
    Object.assign(config, tagPolicy)
  }

  // Always assigned, including when we have no policy — `null` is what
  // trustedTypesPolicy() returns then, and `TRUSTED_TYPES_POLICY: null` is
  // DOMPurify's documented per-call opt-out: sign nothing, create nothing.
  //
  // Leaving the key out is a different thing entirely, and the wrong one. With no
  // key DOMPurify falls through to _getDefaultTrustedTypesPolicy() and asks the
  // browser for `dompurify` — the very name this exists to stop competing for — so
  // an omitted key would disarm the sanitizer of a host shipping
  // `trusted-types dompurify` on the one path where we couldn't get our own.
  // Present-and-`undefined` lands in that same fallthrough, so it is not a
  // substitute for `null` either.
  config.TRUSTED_TYPES_POLICY = trustedTypesPolicy()

  return config
}

function allowlistFor(allowedElements) {
  // Null prototype, so a declared tag can never read through to an
  // Object.prototype key: `tagAttributes["constructor"]` would answer with a
  // function, and ADD_ATTR would call .includes on it.
  const tagAttributes = Object.create(null)
  const uriSafeAttributes = []

  // Lowercased, because DOMPurify lowercases ALLOWED_TAGS and calls ADD_ATTR
  // with the lowercased tag and attribute names. Keeping the caller's casing
  // makes allowedElements silently partial: `[ "IMG" ]` allows the element but
  // drops the width/height below, and `[ { tag: "img", attributes: [ "GID" ] } ]`
  // drops the attribute it declares.
  for (const element of allowedElements) {
    const tag = String(element.tag ?? element).toLowerCase()
    const attributes = (element.attributes ?? []).map(attribute => attribute.toLowerCase())

    tagAttributes[tag] ||= []
    tagAttributes[tag].push(...attributes)

    // An attribute a caller declares URI-safe skips DOMPurify's scheme check — the
    // same attribute-name-wide exemption `url`/`caption`/`filename` carry above. It
    // is how a custom-scheme identifier value survives sanitization: a mention's
    // `gid="gid://…"`, for one, which DOMPurify otherwise drops as an unknown
    // scheme even once the `gid` name is allowed.
    //
    // A navigational attribute is never exemptable, even when declared. The
    // exemption is attribute-name-wide (DOMPurify has no per-tag one), so exempting
    // `href`/`src`/etc. would route a `javascript:`/`data:` value to a navigational
    // or resource sink unchecked, on every tag — the class this sanitizer exists to
    // stop. It is dropped rather than honored, so a mistaken or hostile declaration
    // fails safe: the attribute keeps its scheme check.
    for (const attribute of element.uriSafeAttributes ?? []) {
      const name = attribute.toLowerCase()
      if (!NEVER_URI_SAFE.includes(name)) uriSafeAttributes.push(name)
    }
  }

  // Only for tags the caller already permits — this widens what an allowed
  // element may carry, never which elements are allowed.
  for (const [ tag, attributes ] of Object.entries(DEFAULT_TAG_ATTRIBUTES)) {
    if (tagAttributes[tag]) tagAttributes[tag].push(...attributes)
  }

  return {
    ALLOWED_TAGS: Object.keys(tagAttributes),
    ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
    ADD_ATTR: (attribute, tag) => tagAttributes[tag]?.includes(attribute),
    uriSafeAttributes
  }
}
