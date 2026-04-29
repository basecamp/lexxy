import { expect } from "@playwright/test"

// Public NativeAdapter contract. Hard-coded so a regression that drops a key is caught here
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

// Installs NativeAdapter on the <lexxy-editor> and starts collecting
// `lexxy:attributes-change` event details into a window-side array. The Node side
// reads the array via `events()` / `last()` / `count()`.
export class NativeCapture {
  constructor(page, selector = "lexxy-editor") {
    this.page = page
    this.selector = selector
  }

  async install() {
    await this.page.evaluate(({ selector }) => {
      const el = document.querySelector(selector)
      window.__nativeCapture = []
      el.addEventListener("lexxy:attributes-change", (event) => {
        window.__nativeCapture.push(JSON.parse(JSON.stringify(event.detail)))
      })
      el.registerAdapter(new window.LexxyNativeAdapter(el))
    }, { selector: this.selector })
  }

  async events() {
    return await this.page.evaluate(() => window.__nativeCapture.slice())
  }

  async count() {
    return await this.page.evaluate(() => window.__nativeCapture.length)
  }

  async last() {
    return await this.page.evaluate(() => window.__nativeCapture.at(-1))
  }

  async reset() {
    await this.page.evaluate(() => { window.__nativeCapture = [] })
  }

  async assertContract() {
    const events = await this.events()
    for (const detail of events) assertContract(detail)
  }
}

function assertContract(detail) {
  expect(detail, "detail must be an object").toBeTruthy()
  expect(Object.keys(detail).sort()).toEqual([ "attributes", "headingTag", "highlight", "link" ])

  expect(Object.keys(detail.attributes).sort()).toEqual(EXPECTED_ATTRIBUTE_KEYS)

  for (const [ key, value ] of Object.entries(detail.attributes)) {
    expect(typeof value.enabled, `attributes.${key}.enabled`).toBe("boolean")
    if (key === "heading") {
      expect([ true, false, null ]).toContain(value.active)
      expect(HEADING_TAGS).toContain(value.tag)
    } else {
      expect(typeof value.active, `attributes.${key}.active`).toBe("boolean")
    }
  }

  expect(typeof detail.link.active).toBe("boolean")
  expect(typeof detail.link.enabled).toBe("boolean")
  if (detail.link.active) {
    expect(typeof detail.link.href).toBe("string")
    expect(detail.link.href.length).toBeGreaterThan(0)
  } else {
    expect(detail.link.href).toBeNull()
  }

  expect(typeof detail.highlight.active).toBe("boolean")
  expect(typeof detail.highlight.enabled).toBe("boolean")
  if (detail.highlight.active) {
    const hasColor = typeof detail.highlight.color === "string"
    const hasBg = typeof detail.highlight.backgroundColor === "string"
    expect(hasColor || hasBg, "highlight active requires color or backgroundColor").toBe(true)
  } else {
    expect(detail.highlight.color).toBeNull()
    expect(detail.highlight.backgroundColor).toBeNull()
  }

  expect(HEADING_TAGS).toContain(detail.headingTag)
  expect(detail.headingTag).toBe(detail.attributes.heading.tag)
}
