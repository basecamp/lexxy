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

  for (const channel of [ "assertive", "polite" ]) {
    test(`keeps consecutive ${channel} announcements until each expires`, async ({ page }) => {
      const region = page.locator("lexxy-live-region")
      const additions = region.locator(`[aria-live='${channel}'][aria-relevant='additions']`)
      const polite = channel === "polite"
      await pauseClock(page)

      await region.evaluate((element, polite) => element.announce("First", { polite }), polite)
      await page.clock.runFor(100)
      await region.evaluate((element, polite) => element.announce("Second", { polite }), polite)

      await expect(additions.locator(":scope > *")).toHaveText([ "First", "Second" ])
      await page.clock.runFor(899)
      await expect(additions.locator(":scope > *")).toHaveText([ "First", "Second" ])
      await page.clock.runFor(1)
      await expect(additions.locator(":scope > *")).toHaveText([ "Second" ])
      await page.clock.runFor(100)
      await expect(additions).toBeEmpty()
    })
  }

  test("an earlier cleanup does not interrupt the latest announcement", async ({ page }) => {
    const region = page.locator("lexxy-live-region")
    const additions = region.locator("[aria-live='assertive'][aria-relevant='additions']")
    await pauseClock(page)

    await region.evaluate((element) => element.announce("First"))
    await page.clock.runFor(500)
    await region.evaluate((element) => element.announce("Second"))
    await page.clock.runFor(500)

    await expect(additions).toHaveText("Second")
    await page.clock.runFor(500)
    await expect(additions).toBeEmpty()
  })

  test("keeps an announcement through accessibility update batching", async ({ page }) => {
    const region = page.locator("lexxy-live-region")
    const additions = region.locator("[aria-live='assertive'][aria-relevant='additions']")
    await pauseClock(page)

    await region.evaluate((element) => element.announce("Moved"))
    await page.clock.runFor(999)

    await expect(additions).toHaveText("Moved")
    await page.clock.runFor(1)
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

  test("falls back to an assertive channel", async ({ page }) => {
    const region = page.locator("lexxy-live-region")
    const assertive = region.locator("[aria-live='assertive'][aria-relevant='additions']")

    await region.evaluate((element) => element.announce("Moved"))

    await expect(assertive).toHaveText("Moved")
  })

  test("a polite announcement goes to the polite channel, leaving the assertive one alone", async ({ page }) => {
    const region = page.locator("lexxy-live-region")
    const assertive = region.locator("[aria-live='assertive'][aria-relevant='additions']")
    const polite = region.locator("[aria-live='polite'][aria-relevant='additions']")

    await region.evaluate((element) => element.announce("Image caption", { polite: true }))

    await expect(polite).toHaveText("Image caption")
    await expect(assertive).toBeEmpty()
  })

  test("a polite announcement uses normal priority with ariaNotify", async ({ page }) => {
    const calls = await page.evaluate(() => {
      const calls = []
      document.ariaNotify = (message, options) => calls.push({ message, ...options })
      const region = document.querySelector("lexxy-live-region")
      region.announce("Image caption", { polite: true })
      region.announce("Attachment moved up")
      return calls
    })

    expect(calls).toEqual([
      { message: "Image caption", priority: "normal" },
      { message: "Attachment moved up", priority: "high" }
    ])
  })
})

async function pauseClock(page) {
  await page.clock.install()
  const pauseAt = await page.evaluate(() => Date.now() + 1000)
  await page.clock.pauseAt(pauseAt)
}
