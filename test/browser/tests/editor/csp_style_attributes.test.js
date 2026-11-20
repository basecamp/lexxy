import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// A page whose Content Security Policy forbids inline style attributes reports a
// violation whenever HTML carrying one is parsed. Reading the value of formatted
// text must not parse any: the export's white-space style never reaches the value.
test.describe("Value under a CSP without inline style attributes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/csp-style-attributes.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("reading the value of formatted text reports no violation", async ({ page, editor }) => {
    await editor.flush()

    expect(await editor.value()).toBe("<p><strong>Bold</strong> <em>italic</em> and <u>underlined</u> text</p>")
    expect(await page.evaluate(() => window.styleViolations)).toEqual([])
  })

  test("formatting typed text reports no violation", async ({ page, editor }) => {
    await editor.setValue("")
    await editor.click()
    await editor.clickToolbarButton("bold")
    await editor.send(..."Bold".split(""))
    await editor.flush()

    expect(await editor.value()).toBe("<p><strong>Bold</strong></p>")
    expect(await page.evaluate(() => window.styleViolations)).toEqual([])
  })
})
