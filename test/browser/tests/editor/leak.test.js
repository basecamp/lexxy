import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const CYCLES = 10
const CONTENT = "<h2>Heading</h2><p>Some <strong>rich</strong> text with <a href='https://example.com'>a link</a>.</p><ul><li>Item one</li><li>Item two</li></ul><p>End.</p>"

test.describe("Leak test", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "CDP requires Chromium")

  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.focus()
    await editor.setValue(CONTENT)
  })

  test(`no listener leaks across ${CYCLES} reconnect cycles`, async ({ page, editor }) => {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Performance.enable")

    const getListenerCount = async () => {
      await cdp.send("HeapProfiler.collectGarbage")
      const { metrics } = await cdp.send("Performance.getMetrics")
      return metrics.find((m) => m.name === "JSEventListeners")?.value ?? 0
    }

    // Run one warmup cycle so one-time lazy initialization is excluded
    await reconnect(page, editor)
    const baseline = await getListenerCount()

    for (let i = 0; i < CYCLES; i++) {
      await reconnect(page, editor)
    }

    const final = await getListenerCount()
    expect(final - baseline).toBe(0)

    await cdp.detach()
  })

  test(`no node leaks across ${CYCLES} reconnect cycles`, async ({ page, editor }) => {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Performance.enable")

    const getNodeCount = async () => {
      await cdp.send("HeapProfiler.collectGarbage")
      const { metrics } = await cdp.send("Performance.getMetrics")
      return metrics.find((m) => m.name === "Nodes")?.value ?? 0
    }

    await reconnect(page, editor)
    const baseline = await getNodeCount()

    for (let i = 0; i < CYCLES; i++) {
      await reconnect(page, editor)
    }

    const final = await getNodeCount()
    expect(final - baseline).toBe(0)

    await cdp.detach()
  })
})

async function reconnect(page, editor) {
  await page.evaluate(() => {
    const el = document.querySelector("lexxy-editor")
    const parent = el.parentElement
    parent.removeChild(el)
    parent.appendChild(el)
  })
  await editor.waitForConnected()
}
