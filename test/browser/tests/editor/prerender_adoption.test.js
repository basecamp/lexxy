import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

async function topOf(locator) {
  return (await locator.boundingBox()).y
}

test.describe("Prerendered content element", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prerender.html?manual")
  })

  test("keeps following content stable when the editor hugs its contents", async ({ page }) => {
    const withoutFollowing = page.locator("[data-following='without-prerender']")
    const withFollowing = page.locator("[data-following='with-prerender']")
    const withoutBefore = await topOf(withoutFollowing)
    const withBefore = await topOf(withFollowing)

    await page.evaluate(() => window.loadLexxy())
    // `connected` is set before Lexical mounts (mount happens in a following
    // animation frame), so wait for the mounted roots or the height change we
    // assert on could be measured before it happens.
    await expect(page.locator("lexxy-editor .lexxy-editor__content[data-lexical-editor='true']")).toHaveCount(2)

    const withoutAfter = await topOf(withoutFollowing)
    const withAfter = await topOf(withFollowing)

    // Absolute displacement: a signed comparison would let a large *upward* shift
    // through as a comfortably negative number.
    expect(Math.abs(withAfter - withBefore)).toBeLessThan(1)
    expect(withoutAfter - withoutBefore).toBeGreaterThan(60)
  })

  // The content element reserves the body; the toolbar placeholder reserves the
  // element connectedCallback prepends above it. The fixture floats its toolbar,
  // which would hide a failure here, so put it back in normal flow — the stock
  // arrangement — and require the same stability.
  test("reserves the default toolbar's height too, when it takes space in flow", async ({ page }) => {
    await page.addStyleTag({ content: `.inline-editor lexxy-toolbar {
      position: static !important; opacity: 1 !important; visibility: visible !important; inset: auto !important; }` })

    const following = page.locator("[data-following='with-prerender']")
    const before = await topOf(following)

    await page.evaluate(() => window.loadLexxy())
    await expect(page.locator("lexxy-editor .lexxy-editor__content[data-lexical-editor='true']")).toHaveCount(2)

    // The real toolbar is in flow and has height, so this asserts the reservation
    // matched it rather than that there was nothing to reserve.
    const toolbar = await page.locator("[data-example='with-prerender'] lexxy-toolbar").boundingBox()
    expect(toolbar.height).toBeGreaterThan(0)
    expect(Math.abs(await topOf(following) - before)).toBeLessThan(1)
  })

  // The prerendered toolbar is ours, not the caller's: the editor fills it in
  // rather than leaving it empty or building a second one beside it.
  test("fills the prerendered toolbar instead of adding another", async ({ page }) => {
    const toolbars = page.locator("[data-example='with-prerender'] lexxy-toolbar")
    await expect(toolbars).toHaveCount(1)
    await expect(toolbars.first()).toBeEmpty()

    await page.evaluate(() => window.loadLexxy())
    await expect(page.locator("lexxy-editor[connected]")).toHaveCount(2)

    await expect(toolbars).toHaveCount(1)
    await expect(toolbars.first()).not.toBeEmpty()
    await expect(toolbars.first()).not.toHaveAttribute("aria-hidden")
  })

  test("adopts the server-rendered content element rather than creating a second", async ({ page }) => {
    await page.evaluate(() => window.loadLexxy())
    await expect(page.locator("lexxy-editor[connected]")).toHaveCount(2)

    const content = page.locator("[data-example='with-prerender'] lexxy-editor > .lexxy-editor__content")

    // Exactly one content element: the server's was reused, not duplicated.
    await expect(content).toHaveCount(1)
    // ...and it is the very node the server rendered.
    await expect(content).toHaveAttribute("data-prerendered", "server")
    // Lexical reconciled its state into that adopted node.
    await expect(content).toHaveAttribute("data-lexical-editor", "true")
    // Content is intact...
    await expect(content.locator("p")).toHaveText([ "Alpha", "Bravo", "Charlie", "Delta" ])
    // ...and adoption dressed the static server markup with the interactive
    // attributes the server deliberately omits (it isn't editable until now).
    await expect(content).toHaveAttribute("contenteditable", "true")
    await expect(content).toHaveAttribute("role", "textbox")
    await expect(content).toHaveAttribute("aria-multiline", "true")
  })

  test("exposes the value once, without duplicating the body", async ({ page }) => {
    await page.evaluate(() => window.loadLexxy())
    await expect(page.locator("lexxy-editor[connected]")).toHaveCount(2)

    const value = await page.locator("[data-example='with-prerender'] lexxy-editor").evaluate(editor => editor.value)
    expect(value).toBe("<p>Alpha</p><p>Bravo</p><p>Charlie</p><p>Delta</p>")
  })
})
