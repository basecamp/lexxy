import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const PROMPT_ITEMS_HTML = `
  <lexxy-prompt-item search="Card One" sgid="test-sgid-card-one">
    <template type="menu"><span class="card-ref">Card One</span></template>
    <template type="editor"><span class="card-ref">Card One</span></template>
  </lexxy-prompt-item>
  <lexxy-prompt-item search="Card Two" sgid="test-sgid-card-two">
    <template type="menu"><span class="card-ref">Card Two</span></template>
    <template type="editor"><span class="card-ref">Card Two</span></template>
  </lexxy-prompt-item>
`

test.describe("# prompt freeze with remote-filtering source (Fizzy config)", () => {
  test.beforeEach(async ({ page }) => {
    let requestCount = 0

    await page.route("**/prompt-items**", async (route) => {
      requestCount++
      await new Promise((resolve) => setTimeout(resolve, 50))
      await route.fulfill({
        contentType: "text/html",
        body: PROMPT_ITEMS_HTML,
      })
    })

    await page.exposeFunction("getRequestCount", () => requestCount)
    await page.goto("/prompt-hash-remote-filter.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("space during first popover load does not freeze editor", async ({ page, editor }) => {
    await editor.send("#")
    await editor.flush()

    // Press SPACE before remote-filtering completes (200ms debounce + network)
    await editor.content.press("Space")

    await expect.poll(
      () => page.evaluate(() => window.getRequestCount()),
      { message: "remote filter fetch should complete", timeout: 5000 }
    ).toBeGreaterThan(0)
    await editor.flush()

    await expect(page.locator(".lexxy-prompt-menu--visible")).not.toBeVisible()
    await editor.send("hello")
    await editor.flush()
    await expect(page.locator(".lexxy-editor__content")).toContainText("hello")
  })

  test("space after visible popover does not freeze editor", async ({ page, editor }) => {
    await editor.send("#")
    await editor.flush()

    // Wait for the menu to fully appear, then press SPACE
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5000 })
    await editor.content.press("Space")
    await editor.flush()
    await page.waitForTimeout(500)

    await expect(page.locator(".lexxy-prompt-menu--visible")).not.toBeVisible()
    await editor.send("hello")
    await editor.flush()
    await expect(page.locator(".lexxy-editor__content")).toContainText("hello")
  })

  test("space during cached popover reload does not freeze editor", async ({ page, editor }) => {
    const jsErrors = []
    page.on("pageerror", (error) => jsErrors.push(error.message))

    // First trigger: build and cache the popover
    await editor.send("#")
    await editor.flush()
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5000 })

    // Dismiss and clear
    await editor.content.press("Escape")
    await editor.flush()
    await editor.content.press("Backspace")
    await editor.flush()

    // Second trigger: popover is cached (#buildPopover skipped),
    // goes straight to #showFilteredOptions → 200ms debounce
    await editor.send("#")
    await editor.flush()

    // SPACE during debounce — no listeners registered yet to detect it
    await editor.content.press("Space")
    await page.waitForTimeout(1000)

    const crashErrors = jsErrors.filter((e) =>
      e.includes("selectionTransform") || e.includes("Lexical error") || e.includes("Minified Lexical")
    )
    expect(crashErrors).toHaveLength(0)

    await editor.flush()
    await expect(page.locator(".lexxy-prompt-menu--visible")).not.toBeVisible()
    await editor.send("hello")
    await editor.flush()
    await expect(page.locator(".lexxy-editor__content")).toContainText("hello")
  })
})
