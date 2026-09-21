import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Live region", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.evaluate(() => document.ariaNotify = undefined)
  })

  test("treats every announcement as a new addition", async ({ page }) => {
    const region = page.locator("lexxy-live-region")
    const additions = region.locator("[aria-live='assertive'][aria-relevant='additions']")

    await expect(additions).toHaveAttribute("aria-live", "assertive")
    expect(await additions.getAttribute("aria-atomic")).toBeNull()

    await pauseClock(page)
    await region.evaluate((element) => {
      element.announce("Repeated")
      element.announce("Repeated")
    })

    await expect(additions.locator(":scope > *")).toHaveText([ "Repeated", "Repeated" ])
  })

  test("keeps consecutive announcements until each expires", async ({ page }) => {
    const region = page.locator("lexxy-live-region")
    const additions = region.locator("[aria-relevant='additions']")
    await pauseClock(page)

    await region.evaluate(element => element.announce("First"))
    await page.clock.runFor(100)
    await region.evaluate(element => element.announce("Second"))

    await expect(additions.locator(":scope > *")).toHaveText([ "First", "Second" ])
    await page.clock.runFor(899)
    await expect(additions.locator(":scope > *")).toHaveText([ "First", "Second" ])
    await page.clock.runFor(1)
    await expect(additions.locator(":scope > *")).toHaveText([ "Second" ])
    await page.clock.runFor(100)
    await expect(additions).toBeEmpty()
  })

  test("clears a transient announcement without using the additions channel", async ({ page }) => {
    const region = page.locator("lexxy-live-region")
    const transient = region.locator("[aria-atomic='true']")
    await pauseClock(page)

    await region.evaluate((element) => element.announce("Caption", { transient: true }))

    await expect(transient).toHaveAttribute("aria-live", "assertive")
    await expect(transient).toHaveAttribute("aria-relevant", "all")
    await expect(transient).toHaveText("Caption")
    await page.clock.runFor(34)
    await expect(transient).toBeEmpty()
    await expect(region.locator("[aria-live='assertive'][aria-relevant='additions']")).toBeEmpty()
  })

  test("uses ariaNotify for every announcement when available", async ({ page }) => {
    const region = page.locator("lexxy-live-region")

    await page.evaluate(() => {
      window.__lexxyAriaNotifications = []
      document.ariaNotify = (message, options) => window.__lexxyAriaNotifications.push({ message, options })
    })
    await region.evaluate((element) => {
      element.announce("Status")
      element.announce("Caption", { transient: true })
      element.announce("Moved")
    })

    expect(await page.evaluate(() => window.__lexxyAriaNotifications)).toEqual([
      { message: "Status", options: { priority: "high" } },
      { message: "Caption", options: { priority: "high" } },
      { message: "Moved", options: { priority: "high" } }
    ])
    await expect(region.locator("[aria-atomic='true']")).toBeEmpty()
    await expect(region.locator("[aria-live='assertive'][aria-relevant='additions']")).toBeEmpty()
  })

})

async function pauseClock(page) {
  await page.clock.install()
  const pauseAt = await page.evaluate(() => Date.now() + 1000)
  await page.clock.pauseAt(pauseAt)
}
