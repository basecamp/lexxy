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
// Some properties are refused whatever an extension declares, because they load
// resources or bind behavior with values an editor has no business storing. The
// list can't make layout safe, though: transform, margins or z-index can move
// content over the host page as well as position can, so which layout properties
// to open is the extension author's call. A refused property is dropped with a
// warning, so the author learns about it while developing.

const FORBIDDEN_STYLE_PROPERTIES = new Set([
  "background",
  "behavior",
  "content",
  "cursor",
  "fill",
  "list-style",
  "position",
  "src",
  "stroke"
])

// Families named by what they take, so a vendor alias or a new longhand is
// refused without being listed: -webkit-clip-path, -webkit-mask-box-image-source,
// mask-border, -webkit-backdrop-filter, the offset shorthand of offset-path.
const FORBIDDEN_STYLE_PROPERTY_PATTERN = /image|mask|filter|clip-path|shape-outside|^offset|marker|binding|reflect|behavior/

// color and background-color are governed by the built-in rule (and the
// highlight extension's canonicalization), so an extension can neither redeclare
// nor narrow them.
export const DEFAULT_ALLOWED_STYLE_PROPERTIES = [ "color", "background-color" ]

// A plain or vendor-prefixed property name. Custom properties (`--x`) are not
// declarable: they would let content define values that var() elsewhere reads.
const PROPERTY_NAME = /^-?[a-z]+(?:-[a-z]+)*$/

// The style filter splits declarations with Lexical's CSS parser and serializes
// the survivors back, so what it checks is only what the browser applies if both
// parsers agree on where each value ends. They don't, on two counts: Lexical
// takes a backslash outside quotes as a plain character while the browser takes
// `\"` as an escaped quote, and Lexical runs a string across a newline while the
// browser ends it there. Either lets a value that looks like one harmless
// declaration to us read as several to the browser, background-image included.
// So no value may contain a backslash or a line break, and quotes and brackets
// must balance, so a value can't swallow the declarations serialized after it.
// Without those, the two parsers agree.
//
// Checked against the value as Lexical's CSS parser returns it, which has already
// dropped comments — so `u/**/rl(` arrives here as `url(` and is caught.
const STRUCTURALLY_UNSAFE_STYLE_VALUE = /[\\\n\r\f<>{}@;]|\/\*|javascript:/i

// Functions that fetch or embed a resource, or run script. Applied to the
// built-in properties too: no color needs one.
const RESOURCE_STYLE_FUNCTION = /(?:url|expression|image|image-set|cross-fade|element|paint|src|attr)\s*\(/i

// Only for extension properties. `!`, so content can't outrank the host's own
// !important rules. var() and env(), because the browser substitutes the host's
// value after the validator ran, so a validator's shape check doesn't hold.
// color and background-color keep them: highlights are stored as var() colors.
const EXTENSION_ONLY_UNSAFE_STYLE_VALUE = /!|(?:var|env)\s*\(/i

export function buildStylePolicy(allowedStyles = []) {
  const policy = new Map()

  for (const declaration of allowedStyles ?? []) {
    const property = String(declaration?.property ?? "").trim().toLowerCase()
    const acceptor = acceptorFor(declaration)

    if (!PROPERTY_NAME.test(property) || DEFAULT_ALLOWED_STYLE_PROPERTIES.includes(property)) {
      warn(`ignoring allowed style "${property}": not a property an extension can declare`)
    } else if (FORBIDDEN_STYLE_PROPERTIES.has(property) || FORBIDDEN_STYLE_PROPERTY_PATTERN.test(property)) {
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

// For color and background-color, whose values are otherwise kept as they come.
export function isSafeBuiltInStyleValue(value) {
  return isStructurallySafe(String(value))
}

// The value to keep for an extension property, or null to drop it.
export function allowedStyleValue(policy, property, value) {
  const acceptors = policy?.get(property)
  if (!acceptors) return null

  const candidate = String(value).trim()
  if (candidate === "" || !isStructurallySafe(candidate) || EXTENSION_ONLY_UNSAFE_STYLE_VALUE.test(candidate)) return null

  for (const accept of acceptors) {
    const accepted = accept(candidate)
    if (accepted !== null) return accepted
  }

  return null
}

function isStructurallySafe(value) {
  return !STRUCTURALLY_UNSAFE_STYLE_VALUE.test(value) && !RESOURCE_STYLE_FUNCTION.test(value) && isBalanced(value)
}

// Quotes close, and brackets close in order outside them. No backslash reaches
// here, so there are no escapes to account for.
function isBalanced(value) {
  const closers = { "(": ")", "[": "]" }
  const expected = []
  let quote = null

  for (const char of value) {
    if (quote) {
      if (char === quote) quote = null
    } else if (char === "\"" || char === "'") {
      quote = char
    } else if (closers[char]) {
      expected.push(closers[char])
    } else if (char === ")" || char === "]") {
      if (expected.pop() !== char) return false
    }
  }

  return quote === null && expected.length === 0
}

// An acceptor returns the value to keep, or null.
//
// A fixed list matches case-insensitively, since CSS keywords are, but keeps the
// declared spelling rather than the content's: some values are case-sensitive
// (an animation name, a font family), and the output must always be one the
// extension declared.
//
// A validator is called during sanitizing and must be pure: in particular it must
// not sanitize anything itself, which would swap the policy in use mid-call.
function acceptorFor(declaration) {
  if (Array.isArray(declaration?.values) && declaration.values.length) {
    const values = new Map(declaration.values.map(value => String(value).trim()).map(value => [ value.toLowerCase(), value ]))
    return candidate => values.get(candidate.toLowerCase()) ?? null
  } else if (typeof declaration?.validate === "function") {
    const validate = declaration.validate
    return candidate => {
      try {
        return validate(candidate) === true ? candidate : null
      } catch {
        return null
      }
    }
  } else {
    return null
  }
}

function warn(message) {
  console.warn(`Lexxy: ${message}.`)
}
