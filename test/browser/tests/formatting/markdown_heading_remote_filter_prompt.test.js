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

    // RemoteFilterSource uses debounceAsync(200ms) + network fetch
    // Simulate realistic server response time
    await page.route("**/prompt-items**", async (route) => {
      requestCount++
      // 50ms simulates a fast server response; the 200ms debounce in RemoteFilterSource
      // is the primary source of async delay
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

  test("space pressed during remote-filter popover load does not freeze editor", async ({ page, editor }) => {
    // Type # to trigger the prompt
    await editor.send("#")
    await editor.flush()

    // Press SPACE before the remote-filtering source completes (200ms debounce + network)
    // This triggers the markdown heading shortcut: "# " -> h1
    await editor.content.press("Space")

    // Wait for the remote fetch to complete
    await expect.poll(
      () => page.evaluate(() => window.getRequestCount()),
      { message: "remote filter fetch should complete", timeout: 5000 }
    ).toBeGreaterThan(0)

    await editor.flush()

    // Popover should NOT be visible
    await expect(page.locator(".lexxy-prompt-menu--visible")).not.toBeVisible()

    // Editor should accept typing (not frozen)
    await editor.send("hello")
    await editor.flush()
    await expect(page.locator(".lexxy-editor__content")).toContainText("hello")
  })

  test("typing after # heading conversion produces no JS errors", async ({ page, editor }) => {
    // Collect JS errors
    const jsErrors = []
    page.on("pageerror", (error) => jsErrors.push(error.message))

    // Type # to trigger the prompt (starts 200ms debounce in RemoteFilterSource)
    await editor.send("#")
    await editor.flush()

    // Wait 100ms to land INSIDE the 200ms debounce window, then press space
    await page.waitForTimeout(100)
    await editor.content.press("Space")

    // Wait for everything to settle
    await expect.poll(
      () => page.evaluate(() => window.getRequestCount()),
      { message: "remote filter fetch should complete", timeout: 5000 }
    ).toBeGreaterThan(0)
    await editor.flush()

    // Type some text
    await editor.send("hello world")
    await editor.flush()

    // Verify no selectionTransform errors
    const selectionErrors = jsErrors.filter((e) => e.includes("selectionTransform"))
    expect(selectionErrors).toHaveLength(0)

    // Verify no Lexical errors
    const lexicalErrors = jsErrors.filter((e) => e.includes("Lexical error") || e.includes("Minified Lexical"))
    expect(lexicalErrors).toHaveLength(0)

    await expect(page.locator(".lexxy-editor__content")).toContainText("hello world")
  })
})
