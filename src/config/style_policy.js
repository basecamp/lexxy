// The inline style properties an editor's extensions may add to the sanitizer's
// style allowlist, beyond the built-in color and background-color.
//
// An extension declares each property together with the values it accepts:
//
//   get allowedStyles() {
//     return [
//       { property: "text-align", values: [ "left", "center", "right", "justify" ] },
//       { property: "line-height", validate: value => /^\d(\.\d+)?$/.test(value) }
//     ]
//   }
//
// A property on its own is not enough, and is ignored. Allowing a property by
// name lets stored content carry any value for it, and a style value is where the
// CSS attacks live: url() and image-set() load attacker-chosen resources (a
// tracking pixel in every viewer's session), legacy expression() runs script, and
// escapes and comments hide either from a naive check. So every declaration is a
// fixed set of values or a validator, and on top of both every value passes the
// floor below, which no extension can lower.
//
// Some properties are refused whatever an extension declares, because they are
// dangerous with any value an editor would ever want: they load resources, take
// content out of its box to sit over the host page (position: fixed is a
// phishing overlay), or bind behavior. A refused property is dropped with a
// warning, so the extension's author learns about it while developing.

const FORBIDDEN_STYLE_PROPERTIES = new Set([
  "background",
  "background-image",
  "behavior",
  "border-image",
  "border-image-source",
  "content",
  "cursor",
  "filter",
  "clip-path",
  "list-style",
  "list-style-image",
  "mask",
  "mask-image",
  "-webkit-mask",
  "-webkit-mask-image",
  "-moz-binding",
  "offset-path",
  "position",
  "shape-outside",
  "src"
])

// color and background-color are governed by the built-in rule (and the
// highlight extension's canonicalization), so an extension can neither redeclare
// nor narrow them.
export const DEFAULT_ALLOWED_STYLE_PROPERTIES = [ "color", "background-color" ]

// A plain or vendor-prefixed property name. Custom properties (`--x`) are not
// declarable: they would let content define values that var() elsewhere reads.
const PROPERTY_NAME = /^-?[a-z]+(?:-[a-z]+)*$/

// Checked against the value as Lexical's CSS parser returns it, which has already
// dropped comments — so `u/**/rl(` arrives here as `url(` and is caught.
//
// - Functions that fetch or embed a resource, or run script.
// - Backslashes: CSS escapes spell any of the above (`u\72l(`) past a text check.
// - `!`, so content can't outrank the host's own !important rules.
// - Characters that only belong to markup, at-rules or blocks.
// - `javascript:` anywhere, for the benefit of legacy engines.
const UNSAFE_STYLE_VALUE = /(?:url|expression|image|image-set|cross-fade|element|paint|src|attr)\s*\(|[\\!<>{}@;]|\/\*|javascript:/i

export function buildStylePolicy(allowedStyles = []) {
  const policy = new Map()

  for (const declaration of allowedStyles ?? []) {
    const property = String(declaration?.property ?? "").trim().toLowerCase()
    const acceptor = acceptorFor(declaration)

    if (!PROPERTY_NAME.test(property) || DEFAULT_ALLOWED_STYLE_PROPERTIES.includes(property)) {
      warn(`ignoring allowed style "${property}": not a property an extension can declare`)
    } else if (FORBIDDEN_STYLE_PROPERTIES.has(property)) {
      warn(`ignoring allowed style "${property}": this property is never allowed`)
    } else if (!acceptor) {
      warn(`ignoring allowed style "${property}": declare its accepted values or a validate function`)
    } else {
      if (!policy.has(property)) policy.set(property, [])
      policy.get(property).push(acceptor)
    }
  }

  return policy
}

export function isAllowedStyle(policy, property, value) {
  const acceptors = policy?.get(property)
  if (!acceptors) return false

  const candidate = String(value).trim()
  if (candidate === "" || UNSAFE_STYLE_VALUE.test(candidate)) return false

  return acceptors.some(accepts => accepts(candidate))
}

function acceptorFor(declaration) {
  if (Array.isArray(declaration?.values) && declaration.values.length) {
    const values = new Set(declaration.values.map(value => String(value).trim().toLowerCase()))
    return candidate => values.has(candidate.toLowerCase())
  } else if (typeof declaration?.validate === "function") {
    const validate = declaration.validate
    return candidate => {
      try {
        return validate(candidate) === true
      } catch {
        return false
      }
    }
  } else {
    return null
  }
}

function warn(message) {
  console.warn(`Lexxy: ${message}.`)
}
