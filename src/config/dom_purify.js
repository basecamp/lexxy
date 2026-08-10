import createDOMPurify from "dompurify"
import { getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"

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
// Known limitation, and read this before enabling Trusted Types. Every DOMPurify
// instance lazily creates a policy named `dompurify` on its first sanitize, and
// TT rejects a duplicate name, so whichever instance sanitizes second gets none —
// DOMPurify catches that, warns, and carries on unsigned.
//
// Under `require-trusted-types-for 'script'` that is not cosmetic. DOMPurify
// hands its input to DOMParser.parseFromString, which *is* a TT sink — that's
// why it wraps the payload in `trustedTypesPolicy.createHTML` when it has a
// policy. Without one, sanitizing throws. Whichever instance loses the race
// breaks, so this can take out the host app's sanitizing rather than ours.
//
// It's latent today only because no app here sends a `trusted-types` directive,
// and it can't be fixed from inside this file: the distinct-policy route needs a
// name the host's CSP allowlists, and TRUSTED_TYPES_POLICY needs the host to
// supply one. If you're turning TT on, that's the decision to make here — and
// the `insertAdjacentHTML` sink in nodes/custom_action_text_attachment_node.js
// receives a plain string and needs the same attention, independently of this.
const DOMPurify = createDOMPurify(window)

// alt/height/width are inert and carry no URL or script surface, and dropping
// them costs real things: an image inside attachment content loses its alternative
// text entirely, and loses the intrinsic size that keeps it from reflowing the
// line as it loads. srcset is deliberately not here — it carries URLs, so it
// belongs to a consumer that declares it, not to the blanket allowlist.
const ALLOWED_HTML_ATTRIBUTES = [ "alt", "class", "contenteditable", "height", "href", "src", "style", "title", "width" ]

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
    ADD_URI_SAFE_ATTR: [ "caption", "filename" ],
    SAFE_FOR_XML: false, // So that it does not strip attributes that contains serialized HTML (like content)
    // Stimulus behavior attributes must never survive sanitization: they let stored content
    // wire up arbitrary controllers/actions in the viewer's session. FORBID_ATTR wins over
    // ALLOWED_ATTR/ADD_ATTR/ALLOW_DATA_ATTR in DOMPurify, so this holds even though other
    // data-* attributes (data-language, data-trix-*, etc.) are otherwise allowed through.
    FORBID_ATTR: [ "data-controller", "data-action" ]
  }
}
