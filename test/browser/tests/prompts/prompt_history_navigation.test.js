import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Prompt popover across Turbo history navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  // The popover is appended to the <lexxy-editor> subtree, so Turbo serializes it
  // into the page cache on every navigation. An open popover would then be restored
  // as an orphaned, unmanaged element on history back/forward — it reappears and
  // sticks around. Tearing it down before Turbo caches keeps it out of the snapshot.
  test("popover is torn down before Turbo caches the page", async ({ page, editor }) => {
    await editor.send("@")
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })

    await page.evaluate(() => document.dispatchEvent(new Event("turbo:before-cache")))

    const cachedPopovers = await page.locator("lexxy-editor .lexxy-prompt-menu").count()
    expect(cachedPopovers).toBe(0)
  })

  test("popover is removed from the DOM when the prompt element disconnects", async ({ page, editor }) => {
    await editor.send("@")
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })

    await page.evaluate(() => document.querySelector("lexxy-prompt").remove())

    const orphanedPopovers = await page.locator(".lexxy-prompt-menu").count()
    expect(orphanedPopovers).toBe(0)
  })
})
