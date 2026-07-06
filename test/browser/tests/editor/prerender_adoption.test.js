import { expect, test } from "@playwright/test"

async function topOf(locator) {
  return (await locator.boundingBox()).y
}

test.describe("Prerendered content element", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prerender.html?delay=250")
  })

  test("keeps following content stable when the editor hugs its contents", async ({ page }) => {
    const withoutFollowing = page.locator("[data-following='without-prerender']")
    const withFollowing = page.locator("[data-following='with-prerender']")
    const withoutBefore = await topOf(withoutFollowing)
    const withBefore = await topOf(withFollowing)

    await expect(page.locator("lexxy-editor[connected]")).toHaveCount(2)

    const withoutAfter = await topOf(withoutFollowing)
    const withAfter = await topOf(withFollowing)

    expect(withAfter - withBefore).toBeLessThan(1)
    expect(withoutAfter - withoutBefore).toBeGreaterThan(60)
  })

  test("adopts the server-rendered content element rather than creating a second", async ({ page }) => {
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
    await expect(page.locator("lexxy-editor[connected]")).toHaveCount(2)

    const value = await page.locator("[data-example='with-prerender'] lexxy-editor").evaluate(editor => editor.value)
    expect(value).toBe("<p>Alpha</p><p>Bravo</p><p>Charlie</p><p>Delta</p>")
  })
})
