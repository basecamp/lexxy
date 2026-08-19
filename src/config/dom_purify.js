import DOMPurify from "dompurify"
import { getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"
import { URI_BEARING_ATTACHMENT_ATTRIBUTES, attachmentUriFilterHook } from "../helpers/sanitization_helper"

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

export function buildConfig(allowedElements ) {
  // Null prototype, so a declared tag can never read through to an
  // Object.prototype key: `tagAttributes["constructor"]` would answer with a
  // function, and ADD_ATTR would call .includes on it.
  const tagAttributes = Object.create(null)

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
    ADD_URI_SAFE_ATTR: [ "caption", "filename", ...URI_BEARING_ATTACHMENT_ATTRIBUTES ],
    SAFE_FOR_XML: false, // So that it does not strip attributes that contains serialized HTML (like content)
    // Stimulus behavior attributes must never survive sanitization: they let stored content
    // wire up arbitrary controllers/actions in the viewer's session. FORBID_ATTR wins over
    // ALLOWED_ATTR/ADD_ATTR/ALLOW_DATA_ATTR in DOMPurify, so this holds even though other
    // data-* attributes (data-language, data-trix-*, etc.) are otherwise allowed through.
    FORBID_ATTR: [ "data-controller", "data-action" ]
  }
}
