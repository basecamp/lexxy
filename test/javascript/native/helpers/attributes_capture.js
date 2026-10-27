import { expect } from "vitest"

// The payload as the iOS and Android apps decode it, hard-coded rather than derived from
// the implementation. The apps decode link.href as a non-optional string, so a link
// object without one fails the whole message.
const EXPECTED_ATTRIBUTE_KEYS = [
  "bold",
  "code",
  "heading",
  "highlight",
  "italic",
  "link",
  "ordered-list",
  "quote",
  "redo",
  "strikethrough",
  "undo",
  "unordered-list",
]
const HEADING_TAGS = [ "h1", "h2", "h3", "h4", "h5", "h6" ]

export function captureAttributesChange(element) {
  const events = []
  const violations = []

  const handler = (event) => {
    events.push(event.detail)
    try {
      assertContract(event.detail)
    } catch (error) {
      violations.push(error)
    }
  }

  element.addEventListener("lexxy:attributes-change", handler)

  return {
    events,
    violations,
    get count() { return events.length },
    get last() { return events.at(-1) },
    reset() {
      events.length = 0
      violations.length = 0
    },
    dispose() {
      element.removeEventListener("lexxy:attributes-change", handler)
      if (violations.length > 0) throw violations[0]
    }
  }
}

function assertContract(detail) {
  expect(detail, "detail must be an object").toBeTypeOf("object")
  expect(Object.keys(detail).sort(), "detail keys").toEqual([ "attributes", "headingTag", "highlight", "link" ])

  expect(Object.keys(detail.attributes).sort(), "attributes keys").toEqual(EXPECTED_ATTRIBUTE_KEYS)

  for (const [ key, value ] of Object.entries(detail.attributes)) {
    expect(Object.keys(value).sort(), `attributes.${key} keys`).toEqual([ "active", "enabled" ])
    expect(value.active, `attributes.${key}.active`).toBeTypeOf("boolean")
    expect(value.enabled, `attributes.${key}.enabled`).toBeTypeOf("boolean")
  }

  if (detail.attributes.link.active) {
    expect(Object.keys(detail.link), "link keys").toEqual([ "href" ])
    expect(detail.link.href, "link.href").toBeTypeOf("string")
    expect(detail.link.href.length, "link.href length").toBeGreaterThan(0)
  } else {
    expect(detail.link, "link when not in a link").toBeNull()
  }

  if (detail.attributes.highlight.active) {
    const { color, backgroundColor } = detail.highlight
    expect(typeof color === "string" || typeof backgroundColor === "string", "highlight requires color or backgroundColor").toBe(true)
  } else {
    expect(detail.highlight, "highlight when not highlighted").toBeNull()
  }

  if (detail.attributes.heading.active) {
    expect(HEADING_TAGS, "headingTag").toContain(detail.headingTag)
  } else {
    expect(detail.headingTag, "headingTag when not in a heading").toBeNull()
  }
}
