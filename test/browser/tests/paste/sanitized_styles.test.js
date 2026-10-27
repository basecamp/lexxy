import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// The style filter checks values as Lexical's CSS parser splits them, and the
// browser applies what it serializes back. These assert what the browser itself
// makes of the result, which jsdom can't: any parser differential shows up here
// as a declaration the filter never saw.

const PIXEL = "https://attacker.example/p.gif"

const ATTACKS = [
  `<p style='color: \\"; background-image: url(${PIXEL}); x: "'>x</p>`,
  `<p style="color: &quot;x&#10;;background-image:url(${PIXEL});&quot;">x</p>`,
  `<p style='font-family: \\"; background-image: url(${PIXEL}); x: "'>x</p>`,
  `<p style="font-family: &quot;x&#10;;background-image:url(${PIXEL});&quot;">x</p>`,
  `<p style="font-family: 'a&#10;;background-image:url(${PIXEL});'">x</p>`
]

async function appliedStyles(page, html) {
  return page.evaluate((html) => {
    const anything = { property: "font-family", validate: () => true }
    const editor = { _htmlConversions: new Map([ [ "p", () => null ] ]) }
    const sanitized = window.EditorSanitizer.register(editor, [], [ anything ]).sanitize(html)

    const container = document.createElement("div")
    container.insertAdjacentHTML("beforeend", sanitized)
    const style = container.firstElementChild.style

    return Array.from({ length: style.length }, (_, index) => style[index])
  }, html)
}

test.describe("Sanitized styles", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sanitized-styles.html")
    await page.waitForFunction(() => window.EditorSanitizer)
  })

  for (const attack of ATTACKS) {
    test(`applies nothing it didn't check: ${attack}`, async ({ page }) => {
      const applied = await appliedStyles(page, attack)

      expect(applied.filter(property => property !== "color" && property !== "font-family")).toEqual([])
    })
  }

  test("applies the properties it checked", async ({ page }) => {
    const applied = await appliedStyles(page, "<p style=\"color: red; font-family: 'Georgia', serif; position: fixed\">x</p>")

    expect(applied.sort()).toEqual([ "color", "font-family" ])
  })
})
