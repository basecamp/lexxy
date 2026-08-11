import { test } from "../../test_helper.js"
import { EditorHandle } from "../../helpers/editor_handle.js"
import { expect } from "@playwright/test"

// Each editor sanitizes with its own allowlist.
//
// The config used to be one module-level value installed with
// DOMPurify.setConfig(), so the last editor to connect decided how every editor
// on the page sanitized. An editor's `value` is sanitized on read, so a rich
// editor sharing a page with a plain one silently dropped its own headings and
// lists from the value it submitted — with nothing different on screen, because
// the editor DOM was never the thing being rewritten.
//
// The unit test for this runs in JSDOM. This one exists because the failure
// involves the custom-element lifecycle, cached value reads and the bundled
// build, none of which JSDOM proves anything about.
test.describe("sanitizer isolation between editors", () => {
  const RICH = "<h1>Title</h1><ul><li>one</li></ul><p>body</p>"

  test("a rich editor keeps its formatting after a plain editor connects", async ({ page }) => {
    const rich = new EditorHandle(page, "#rich")
    const plain = new EditorHandle(page, "#plain")

    await page.goto("/sanitizer-isolation.html")
    await rich.waitForConnected()
    await plain.waitForConnected()

    await rich.setValue(RICH)

    // Editing clears the cached value, so the next read re-sanitizes. That read
    // is what used to pick up the plain editor's allowlist.
    await rich.click()
    await rich.send("!")

    const value = await rich.value()
    expect(value).toContain("<h1>")
    expect(value).toContain("<ul>")
  })

  test("the plain editor still sanitizes with its own narrower allowlist", async ({ page }) => {
    const rich = new EditorHandle(page, "#rich")
    const plain = new EditorHandle(page, "#plain")

    await page.goto("/sanitizer-isolation.html")
    await rich.waitForConnected()
    await plain.waitForConnected()

    await plain.setValue(RICH)
    await plain.click()
    await plain.send("!")

    // Control: proves the two editors really do resolve different allowlists, so
    // the assertion above isn't passing because both are simply permissive.
    expect(await plain.value()).not.toContain("<h1>")
  })
})
