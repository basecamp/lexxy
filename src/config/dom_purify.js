import DOMPurify from "dompurify"
import { getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"

const ALLOWED_HTML_ATTRIBUTES = [ "class", "contenteditable", "href", "src", "style", "title" ]

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
// So `url` is marked URI-safe, which hands the decision to this hook, and the
// hook allows exactly what DOMPurify allows on an img src: its default scheme
// list plus data:. javascript: and friends are dropped, which is stricter than
// what shipped before the upgrade. The hook only ever removes an attribute — it
// never force-keeps one — so scoping stays with the ADD_ATTR predicate, and a
// `url` on a tag that never declared it is dropped as it always was.
const URI_BEARING_ATTACHMENT_ATTRIBUTES = [ "url" ]
const SAFE_ATTACHMENT_URI = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i
// eslint-disable-next-line no-control-regex -- mirrors DOMPurify's own ATTR_WHITESPACE
const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g

function attachmentUriFilterHook(_currentNode, hookEvent) {
  if (!URI_BEARING_ATTACHMENT_ATTRIBUTES.includes(hookEvent.attrName)) return

  if (!SAFE_ATTACHMENT_URI.test(String(hookEvent.attrValue).replace(ATTR_WHITESPACE, ""))) {
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

DOMPurify.addHook("uponSanitizeAttribute", styleFilterHook)
DOMPurify.addHook("uponSanitizeAttribute", attachmentUriFilterHook)

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

  return {
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
}
