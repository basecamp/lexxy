import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const PROMPT_ITEMS_HTML = `
  <lexxy-prompt-item search="Zacharias" sgid="test-sgid-zacharias">
    <template type="menu">
      <span class="person person--prompt-item">
        <span class="person--name">Zacharias</span>
      </span>
    </template>
    <template type="editor">
      <span class="person person--inline">
        <span class="person--name">Zacharias</span>
      </span>
    </template>
  </lexxy-prompt-item>
  <lexxy-prompt-item search="Alice" sgid="test-sgid-alice">
    <template type="menu">
      <span class="person person--prompt-item">
        <span class="person--name">Alice</span>
      </span>
    </template>
    <template type="editor">
      <span class="person person--inline">
        <span class="person--name">Alice</span>
      </span>
    </template>
  </lexxy-prompt-item>
`

const DEFERRED_DELAY_MS = 75

test.describe("# prompt freeze with deferred source", () => {
  test.beforeEach(async ({ page }) => {
    let requestCount = 0

    await page.route("**/prompt-items**", async (route) => {
      requestCount++
      await new Promise((resolve) => setTimeout(resolve, DEFERRED_DELAY_MS))
      await route.fulfill({
        contentType: "text/html",
        body: PROMPT_ITEMS_HTML,
      })
    })

    // Expose a way to check when the deferred fetch has completed
    await page.exposeFunction("getDeferredRequestCount", () => requestCount)

    await page.goto("/prompt-hash-deferred.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("space pressed during deferred popover load does not freeze editor", async ({ page, editor }) => {
    // Type # to trigger the prompt (deferred source starts a 75ms fetch)
    await editor.send("#")
    await editor.flush()

    // Press SPACE before the deferred popover finishes loading.
    // This triggers the markdown heading shortcut: "# " -> h1, consuming the trigger.
    await editor.content.press("Space")

    // Wait for the deferred fetch to complete so #showPopover() has finished
    await expect.poll(
      () => page.evaluate(() => window.getDeferredRequestCount()),
      { message: "deferred fetch should complete" }
    ).toBeGreaterThan(0)

    // Allow async popover lifecycle to settle
    await editor.flush()

    // The popover should NOT be visible since # was consumed by the heading shortcut
    await expect(page.locator(".lexxy-prompt-menu--visible")).not.toBeVisible()

    // The editor should accept typing
    await editor.send("hello")
    await editor.flush()
    await expect(page.locator(".lexxy-editor__content")).toContainText("hello")
  })
})
