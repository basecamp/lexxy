import { afterEach, describe, expect, test, vi } from "vitest"
import { DOMPurify, buildConfig } from "src/config/dom_purify"
import EditorSanitizer from "src/editor/sanitizer"

const TEXT_ALIGN = { property: "text-align", values: [ "left", "center", "right", "justify" ] }

function sanitizeWith(allowedStyles, html) {
  return DOMPurify.sanitize(html, buildConfig([ "p" ], allowedStyles))
}

function styleOf(html) {
  const template = document.createElement("template")
  template.innerHTML = html
  return template.content.firstElementChild?.getAttribute("style") ?? null
}

function editorAllowing(...tags) {
  return { _htmlConversions: new Map(tags.map(tag => [ tag, () => null ])) }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("dom_purify — extension allowed styles", () => {
  test("keeps only the built-in properties when no extension declares styles", () => {
    expect(styleOf(sanitizeWith([], '<p style="color: red; text-align: center">x</p>'))).toBe("color: red;")
  })

  test("keeps a declared property with one of its declared values", () => {
    expect(styleOf(sanitizeWith([ TEXT_ALIGN ], '<p style="text-align: center; line-height: 2">x</p>')))
      .toBe("text-align: center;")
  })

  test("matches declared values and property names case-insensitively", () => {
    expect(styleOf(sanitizeWith([ TEXT_ALIGN ], '<p style="TEXT-ALIGN: Center">x</p>')))
      .toBe("text-align: Center;")
  })

  test("drops a declared property whose value is not in its set", () => {
    expect(sanitizeWith([ TEXT_ALIGN ], '<p style="text-align: -webkit-center">x</p>')).toBe("<p>x</p>")
  })

  test("keeps the built-in properties alongside extension ones", () => {
    expect(styleOf(sanitizeWith([ TEXT_ALIGN ], '<p style="color: red; text-align: right">x</p>')))
      .toBe("color: red;text-align: right;")
  })

  test("a validator decides the values of its property", () => {
    const lineHeight = { property: "line-height", validate: value => /^\d(\.\d+)?$/.test(value) }

    expect(styleOf(sanitizeWith([ lineHeight ], '<p style="line-height: 1.5">x</p>'))).toBe("line-height: 1.5;")
    expect(sanitizeWith([ lineHeight ], '<p style="line-height: 100px">x</p>')).toBe("<p>x</p>")
  })

  test("two declarations of a property accept the union of their values", () => {
    const left = { property: "text-align", values: [ "left" ] }
    const right = { property: "text-align", values: [ "right" ] }

    expect(styleOf(sanitizeWith([ left, right ], '<p style="text-align: right">x</p>'))).toBe("text-align: right;")
  })

  describe("declarations that are refused", () => {
    test("a property with no values or validator allows nothing", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

      expect(sanitizeWith([ { property: "text-align" } ], '<p style="text-align: center">x</p>')).toBe("<p>x</p>")
      expect(sanitizeWith([ { property: "text-align", values: [] } ], '<p style="text-align: center">x</p>')).toBe("<p>x</p>")
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("text-align"))
    })

    test("a bare property-name string allows nothing", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {})

      expect(sanitizeWith([ "text-align" ], '<p style="text-align: center">x</p>')).toBe("<p>x</p>")
    })

    test.each([
      [ "background-image", "url(https://attacker.example/pixel.gif)" ],
      [ "background", "url(https://attacker.example/pixel.gif)" ],
      [ "position", "fixed" ],
      [ "list-style-image", "url(https://attacker.example/pixel.gif)" ],
      [ "content", "\"x\"" ],
      [ "-moz-binding", "url(https://attacker.example/xbl.xml)" ],
      [ "behavior", "url(https://attacker.example/x.htc)" ]
    ])("%s is never allowed, even with its value declared", (property, value) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

      expect(sanitizeWith([ { property, values: [ value ] } ], `<p style='${property}: ${value}'>x</p>`)).toBe("<p>x</p>")
      expect(sanitizeWith([ { property, validate: () => true } ], `<p style='${property}: ${value}'>x</p>`)).toBe("<p>x</p>")
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("never allowed"))
    })

    test("custom properties can't be declared", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {})

      expect(sanitizeWith([ { property: "--x", validate: () => true } ], '<p style="--x: 1">x</p>')).toBe("<p>x</p>")
    })

    test("an extension can't redeclare the built-in properties", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {})

      // Neither narrows nor otherwise changes the built-in rule.
      expect(styleOf(sanitizeWith([ { property: "color", values: [ "blue" ] } ], '<p style="color: red">x</p>')))
        .toBe("color: red;")
    })
  })

  // A validator that accepts everything is the worst an extension can write. The
  // floor still holds under it.
  describe("adversarial values under a validator that accepts anything", () => {
    const anything = { property: "font-family", validate: () => true }

    test.each([
      [ "url()", "url(https://attacker.example/pixel.gif)" ],
      [ "url() in mixed case with spaces", "URL (https://attacker.example/pixel.gif)" ],
      [ "a comment splitting url()", "u/**/rl(https://attacker.example/pixel.gif)" ],
      [ "a CSS escape spelling url()", "u\\72l(https://attacker.example/pixel.gif)" ],
      [ "expression()", "expression(alert(1))" ],
      [ "image-set()", "image-set(\"https://attacker.example/a.png\" 1x)" ],
      [ "-webkit-image-set()", "-webkit-image-set(url(https://attacker.example/a.png) 1x)" ],
      [ "cross-fade()", "cross-fade(url(a.png), url(b.png), 50%)" ],
      [ "element()", "element(#login)" ],
      [ "attr()", "attr(data-secret)" ],
      [ "!important", "serif !important" ],
      [ "javascript:", "javascript:alert(1)" ],
      [ "an at-rule", "@import 'https://attacker.example/x.css'" ],
      [ "markup", "</style><script>alert(1)</script>" ]
    ])("drops %s", (_name, value) => {
      const html = `<p style='font-family: ${value.replace(/'/g, "&#39;")}'>x</p>`
      const sanitized = sanitizeWith([ anything ], html)

      expect(sanitized).toBe("<p>x</p>")
    })

    test("keeps an ordinary value, so the cases above aren't passing vacuously", () => {
      expect(styleOf(sanitizeWith([ anything ], "<p style=\"font-family: 'Georgia', serif\">x</p>")))
        .toBe("font-family: 'Georgia', serif;")
    })

    test("can't smuggle a second declaration through the value", () => {
      expect(styleOf(sanitizeWith([ anything ], '<p style="font-family: serif; background-image: url(x)">x</p>')))
        .toBe("font-family: serif;")
    })
  })

  test("a validator must return true, not merely something truthy", () => {
    const sloppy = { property: "line-height", validate: () => "yes" }

    expect(sanitizeWith([ sloppy ], '<p style="line-height: 2">x</p>')).toBe("<p>x</p>")
  })

  test("a validator that throws rejects the value", () => {
    const broken = { property: "line-height", validate: () => { throw new Error("boom") } }

    expect(sanitizeWith([ broken ], '<p style="line-height: 2">x</p>')).toBe("<p>x</p>")
  })

  test("a sanitize call that didn't come from buildConfig gets only the built-in properties", () => {
    expect(styleOf(DOMPurify.sanitize('<p style="color: red; text-align: center">x</p>'))).toBe("color: red;")
  })
})

// The policy rides on each editor's config rather than on the shared hook, so one
// editor's extension can't loosen how another editor sanitizes.
describe("EditorSanitizer — allowed styles are per editor", () => {
  const html = '<p style="text-align: center">x</p>'

  test("only the editor whose extension declared a style keeps it", () => {
    const aligned = EditorSanitizer.register(editorAllowing("p"), [], [ TEXT_ALIGN ])
    const plain = EditorSanitizer.register(editorAllowing("p"), [])

    expect(styleOf(aligned.sanitize(html))).toBe("text-align: center;")
    expect(plain.sanitize(html)).toBe("<p>x</p>")

    // Registration order doesn't matter either way.
    expect(styleOf(aligned.sanitize(html))).toBe("text-align: center;")
  })

  test("the fallback for an unregistered editor keeps only the built-in properties", () => {
    EditorSanitizer.register(editorAllowing("p"), [], [ TEXT_ALIGN ])

    expect(EditorSanitizer.for({}).sanitize(html)).toBe("<p>x</p>")
  })

  test("the strict mode keeps the editor's style policy", () => {
    const aligned = EditorSanitizer.register(editorAllowing("p"), [], [ TEXT_ALIGN ])

    expect(styleOf(aligned.sanitize(html, { safeForXml: true }))).toBe("text-align: center;")
  })
})
