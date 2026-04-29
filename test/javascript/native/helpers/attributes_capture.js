import { expect } from "vitest"

// Public contract — hard-coded so a regression that drops a key (or sneaks one in)
// is caught here, not silently re-derived from the implementation.
//
// `attributes` carries the toolbar-state map. `link` and `highlight` are
// dispatched as top-level siblings of `attributes` because they carry extra
// payload (href, color, backgroundColor) that the rest of the keys don't.
const EXPECTED_ATTRIBUTE_KEYS = [
  "bold",
  "code",
  "heading",
  "italic",
  "ordered-list",
  "quote",
  "redo",
  "strikethrough",
  "undo",
  "unordered-list",
]
const HEADING_TAGS = [ null, "h2", "h3", "h4" ]

// Wires a listener on `lexxy:attributes-change` that records every event
// detail and asserts the public contract on each one. Use afterEach to dispose
// and surface any contract violation.
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
    expect(value, `attributes.${key}`).toBeTypeOf("object")
    expect(value.enabled, `attributes.${key}.enabled`).toBeTypeOf("boolean")

    if (key === "heading") {
      expect([ true, false, null ], "attributes.heading.active").toContain(value.active)
      expect(HEADING_TAGS, "attributes.heading.tag").toContain(value.tag)
    } else {
      expect(value.active, `attributes.${key}.active`).toBeTypeOf("boolean")
    }
  }

  expect(detail.link.active, "link.active").toBeTypeOf("boolean")
  expect(detail.link.enabled, "link.enabled").toBeTypeOf("boolean")
  if (detail.link.active) {
    expect(detail.link.href, "link.href when active").toBeTypeOf("string")
    expect(detail.link.href.length, "link.href length when active").toBeGreaterThan(0)
  } else {
    expect(detail.link.href, "link.href when inactive").toBeNull()
  }

  expect(detail.highlight.active, "highlight.active").toBeTypeOf("boolean")
  expect(detail.highlight.enabled, "highlight.enabled").toBeTypeOf("boolean")
  if (detail.highlight.active) {
    const hasColor = typeof detail.highlight.color === "string"
    const hasBg = typeof detail.highlight.backgroundColor === "string"
    expect(hasColor || hasBg, "highlight active requires color or backgroundColor").toBe(true)
  } else {
    expect(detail.highlight.color, "highlight.color when inactive").toBeNull()
    expect(detail.highlight.backgroundColor, "highlight.backgroundColor when inactive").toBeNull()
  }

  expect(HEADING_TAGS, "headingTag").toContain(detail.headingTag)
  expect(detail.headingTag, "headingTag must equal attributes.heading.tag").toBe(detail.attributes.heading.tag)
}
