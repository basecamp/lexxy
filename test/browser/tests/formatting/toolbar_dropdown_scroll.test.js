import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Opening a toolbar dropdown", () => {
  test("keeps the page scroll position with a sticky toolbar under the page's scroll padding", async ({ page, editor }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await page.addStyleTag({ content: `
      html { scroll-padding-block-start: 120px; }
      lexxy-toolbar { position: sticky; inset-block-start: 40px; z-index: 5; }
    ` })

    const block = "<p>Some text</p><ul><li>First</li><li>Second</li></ul>"
    await editor.setValue(block.repeat(40))
    await editor.flush()
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2))

    // Click at the trigger's position: locator.click() would first scroll it clear of the scroll padding itself
    const trigger = await page.locator("lexxy-toolbar button[name='format']").boundingBox()
    const scrollBefore = await page.evaluate(() => window.scrollY)
    await page.mouse.click(trigger.x + trigger.width / 2, trigger.y + trigger.height / 2)

    await expect(page.locator("lexxy-toolbar [data-dropdown-panel]").first()).toBeVisible()
    await expect(page.locator("lexxy-toolbar [data-dropdown-panel] button").first()).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)
  })
})
