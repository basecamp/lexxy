import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

async function readSelection(page) {
  const selected = await page.evaluate(() => window.getSelection().toString())
  return selected.replace(/\s+/g, " ").trim()
}

async function tripleClickDrag(page, fromPoint, toPoint) {
  await page.mouse.move(fromPoint.x, fromPoint.y)
  await page.mouse.down({ clickCount: 1 })
  await page.mouse.up({ clickCount: 1 })
  await page.mouse.down({ clickCount: 2 })
  await page.mouse.up({ clickCount: 2 })
  await page.mouse.down({ clickCount: 3 })
  await page.mouse.move(toPoint.x, toPoint.y, { steps: 5 })
  await page.mouse.up({ clickCount: 3 })
}

function lineMidCenter(box) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

function lineMidRight(box) {
  return { x: box.x + box.width - 1, y: box.y + box.height / 2 }
}

const TWO_PARAGRAPHS = "<p>P1 Line one<br>P1 Line two<br>P1 Line three</p><p>P2 Line one<br>P2 Line two<br>P2 Line three</p>"

test.describe("Prevent Lexical triple-click", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue(TWO_PARAGRAPHS)
    await editor.flush()
  })

  test("triple-clicking 'P1 Line two' selects only that visual line", async ({ page, editor }) => {
    await editor.content.locator("p span", { hasText: "P1 Line two" }).first().click({ clickCount: 3 })

    expect(await readSelection(page)).toBe("P1 Line two")
  })

  test("triple-click and drag from 'P1 Line two' to 'P2 Line two' selects only the four spanned lines", async ({ page, editor }) => {
    const fromBox = await editor.content.locator("p span", { hasText: "P1 Line two" }).first().boundingBox()
    const toBox = await editor.content.locator("p span", { hasText: "P2 Line two" }).first().boundingBox()

    await tripleClickDrag(page, lineMidCenter(fromBox), lineMidRight(toBox))

    expect(await readSelection(page)).toBe("P1 Line two P1 Line three P2 Line one P2 Line two")
  })
})
