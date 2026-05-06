import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Regression: typing "@" near the bottom of the visible area must not
// scroll the page. We stub innerHeight larger than the real viewport to
// simulate the iOS layout-vs-visual gap on a desktop test runner.
test.describe("Prompt popover scroll", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 })
    await page.goto("/mentions.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("opening the picker with cursor near the visual viewport bottom does not scroll the page", async ({ page, editor }) => {
    // Make the page scrollable so any unwanted scroll has somewhere to go.
    await page.evaluate(() => {
      document.body.style.paddingBottom = "2000px"
    })

    // Push the cursor toward the bottom of the viewport.
    await editor.focus()
    for (let i = 0; i < 18; i++) {
      await editor.send("Enter")
    }
    await editor.send("Hello ")

    // Simulate the iOS layout-vs-visual viewport gap.
    await page.evaluate(() => {
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        get() { return 5000 },
      })
    })

    const scrollYBefore = await page.evaluate(() => window.scrollY)

    await editor.send("@")
    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    const scrollYAfter = await page.evaluate(() => window.scrollY)
    expect(Math.abs(scrollYAfter - scrollYBefore)).toBeLessThanOrEqual(2)

    // preventScroll alone could mask a regression that places the popover
    // in the hidden area; assert it landed within the visible viewport.
    const popoverWithinVisualViewport = await page.evaluate(() => {
      const el = document.querySelector(".lexxy-prompt-menu--visible")
      const rect = el.getBoundingClientRect()
      const vv = window.visualViewport
      return rect.bottom <= vv.offsetTop + vv.height + 1
    })
    expect(popoverWithinVisualViewport).toBe(true)
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")
  })

  test("host-supplied --lexxy-host-viewport-height overrides innerHeight and visualViewport for clipping", async ({ page, editor }) => {
    await page.evaluate(() => {
      document.body.style.paddingBottom = "2000px"
    })

    await editor.focus()
    for (let i = 0; i < 18; i++) {
      await editor.send("Enter")
    }
    await editor.send("Hello ")

    // Embedded hosts can leave both innerHeight and visualViewport at
    // layout size and publish the real visible height via the CSS variable.
    await page.evaluate(() => {
      Object.defineProperty(window, "innerHeight", { configurable: true, get() { return 5000 } })
      Object.defineProperty(window.visualViewport, "height", { configurable: true, get() { return 5000 } })
      document.documentElement.style.setProperty("--lexxy-host-viewport-height", "400px")
    })

    const scrollYBefore = await page.evaluate(() => window.scrollY)

    await editor.send("@")
    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    const scrollYAfter = await page.evaluate(() => window.scrollY)
    expect(Math.abs(scrollYAfter - scrollYBefore)).toBeLessThanOrEqual(2)

    // data-clipped-at-bottom proves the override drove the flip — without
    // it lexxy would have read the inflated innerHeight/visualViewport.
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")
  })
})
