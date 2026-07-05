import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// When the server prerenders the content element inside <lexxy-editor> (via
// `rich_text_area(..., prerender: true)`), the editor adopts that element on
// connect instead of building an empty one, so the field keeps its first-paint
// height. Without adoption the editor would append a second content element and
// the field would double-render.
test.describe("Prerendered content element", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prerender.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("adopts the server-rendered content element rather than creating a second", async ({ page }) => {
    const content = page.locator("lexxy-editor .lexxy-editor__content")

    // Exactly one content element — the server's was reused, not duplicated.
    await expect(content).toHaveCount(1)
    // ...and it is the very node the server rendered.
    await expect(content).toHaveAttribute("data-prerendered", "server")
    // Lexical reconciled its state into that adopted node.
    await expect(content).toHaveAttribute("data-lexical-editor", "true")
    // Content is intact...
    await expect(content.locator("p")).toHaveText([ "Alpha", "Bravo" ])
    // ...and adoption dressed the static server markup with the interactive
    // attributes the server deliberately omits (it isn't editable until now).
    await expect(content).toHaveAttribute("contenteditable", "true")
    await expect(content).toHaveAttribute("role", "textbox")
    await expect(content).toHaveAttribute("aria-multiline", "true")
  })

  test("exposes the value once, without duplicating the body", async ({ editor }) => {
    expect(await editor.value()).toBe("<p>Alpha</p><p>Bravo</p>")
  })
})
