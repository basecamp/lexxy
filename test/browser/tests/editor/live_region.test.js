import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Editor announcements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.evaluate(() => document.ariaNotify = undefined)
  })

  test("treats every announcement as a new addition", async ({ page, editor }) => {
    const region = page.locator("lexxy-live-region")
    const additions = region.locator("[aria-live='assertive'][aria-relevant='additions']")

    await expect(additions).toHaveAttribute("aria-live", "assertive")
    expect(await additions.getAttribute("aria-atomic")).toBeNull()

    await pauseClock(page)
    await editor.locator.evaluate((element) => {
      element.announce("Repeated")
      element.announce("Repeated")
    })

    await expect(additions.locator(":scope > *")).toHaveText([ "Repeated", "Repeated" ])
  })

  test("keeps consecutive announcements until each expires", async ({ page, editor }) => {
    const region = page.locator("lexxy-live-region")
    const additions = region.locator("[aria-relevant='additions']")
    await pauseClock(page)

    await editor.locator.evaluate(element => element.announce("First"))
    await page.clock.runFor(100)
    await editor.locator.evaluate(element => element.announce("Second"))

    await expect(additions.locator(":scope > *")).toHaveText([ "First", "Second" ])
    await page.clock.runFor(899)
    await expect(additions.locator(":scope > *")).toHaveText([ "First", "Second" ])
    await page.clock.runFor(1)
    await expect(additions.locator(":scope > *")).toHaveText([ "Second" ])
    await page.clock.runFor(100)
    await expect(additions).toBeEmpty()
  })

  test("disconnecting the live region clears pending announcements", async ({ page, editor }) => {
    const region = page.locator("lexxy-live-region")
    await pauseClock(page)
    await editor.locator.evaluate(element => {
      element.announce("Status")
      const region = element.querySelector("lexxy-live-region")
      region.remove()
      element.append(region)
    })

    await expect(region).toBeEmpty()
    await editor.locator.evaluate(element => element.announce("After reconnecting"))
    await expect(region.locator("[aria-relevant='additions']")).toHaveText("After reconnecting")
    await page.clock.runFor(1000)
    await expect(region).toBeEmpty()
  })

  test("uses ariaNotify for every announcement when available", async ({ page, editor }) => {
    const region = page.locator("lexxy-live-region")

    await page.evaluate(() => {
      window.__lexxyAriaNotifications = []
      document.ariaNotify = (message, options) => window.__lexxyAriaNotifications.push({ message, options })
    })
    await editor.locator.evaluate((element) => {
      element.announce("")
      element.announce(null)
      element.announce("Status")
      element.announce("Moved")
    })

    expect(await page.evaluate(() => window.__lexxyAriaNotifications)).toEqual([
      { message: "Status", options: { priority: "high" } },
      { message: "Moved", options: { priority: "high" } }
    ])
    await expect(region.locator("[aria-live='assertive'][aria-relevant='additions']")).toBeEmpty()
  })

})

async function pauseClock(page) {
  await page.clock.install()
  const pauseAt = await page.evaluate(() => Date.now() + 1000)
  await page.clock.pauseAt(pauseAt)
}
