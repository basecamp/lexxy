import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// When the page sets a scroll padding and pins the toolbar inside it, as Basecamp does,
// the browser treats a focused toolbar button as hidden and scrolls to show it, even
// though the button is already on screen. Moving through the toolbar with the
// keyboard must leave the page where it is.
test.describe("Moving through a pinned toolbar with the keyboard", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await page.addStyleTag({ content: `
      html { scroll-padding-block-start: 120px; }
      lexxy-toolbar { position: sticky; inset-block-start: 40px; z-index: 5; }
    ` })

    const block = "<p>Some text</p><ul><li>First</li><li>Second</li></ul>"
    await editor.setValue(block.repeat(40))
    await editor.flush()
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2))
  })

  // Click at the element's position: locator.click() would first scroll it clear of the scroll padding itself
  async function clickInPlace(page, locator) {
    const box = await locator.boundingBox()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  }

  // Puts keyboard focus on a toolbar button without moving the page, as Shift+Tab would without the bug
  async function focusInPlace(locator) {
    await locator.evaluate((button) => button.focus({ preventScroll: true, focusVisible: true }))
    await expect(locator).toBeFocused()
  }

  const scrollY = (page) => page.evaluate(() => window.scrollY)
  const toolbarHasFocus = (page) => page.evaluate(() => document.activeElement.closest("lexxy-toolbar") !== null)

  test("arrow keys between toolbar buttons keep the page scroll position", async ({ page }) => {
    await focusInPlace(page.locator("lexxy-toolbar button[name='bold']"))
    const scrollBefore = await scrollY(page)

    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")

    await expect(page.locator("lexxy-toolbar button[name='bold']")).not.toBeFocused()
    expect(await toolbarHasFocus(page)).toBe(true)
    expect(await scrollY(page)).toBe(scrollBefore)
  })

  test("Escape from a toolbar menu returns focus to its button without scrolling", async ({ page }) => {
    const trigger = page.locator("lexxy-toolbar button[name='format']")
    await focusInPlace(trigger)
    await page.keyboard.press("Enter")
    await expect(page.locator("lexxy-toolbar [data-dropdown-panel]").first()).toBeVisible()
    await expect.poll(() => toolbarHasFocus(page)).toBe(true)
    const scrollBefore = await scrollY(page)

    await page.keyboard.press("Escape")

    await expect(trigger).toBeFocused()
    expect(await scrollY(page)).toBe(scrollBefore)
  })

  test("Shift+Tab from the text into the toolbar keeps the page scroll position", async ({ page, editor }) => {
    await clickInPlace(page, editor.content.locator("p").nth(20))
    const scrollBefore = await scrollY(page)

    await page.keyboard.press("Shift+Tab")

    await expect.poll(() => toolbarHasFocus(page)).toBe(true)
    expect(await scrollY(page)).toBe(scrollBefore)
  })
  test("Shift+Tab in an indented list item still outdents it", async ({ page, editor }) => {
    await editor.setValue("<ul><li>First<ul><li>Nested</li></ul></li></ul>")
    await editor.flush()
    await editor.content.locator("li li").click()

    await page.keyboard.press("Shift+Tab")
    await editor.flush()

    await expect(editor.content.locator("li li")).toHaveCount(0)
    await expect(editor.content).toBeFocused()
  })

  test("Shift+Tab still brings the toolbar into view when it's off screen", async ({ page, editor }) => {
    await page.addStyleTag({ content: "lexxy-toolbar { position: static; }" })
    await clickInPlace(page, editor.content.locator("p").nth(20))
    await expect(page.locator("lexxy-toolbar")).not.toBeInViewport()

    await page.keyboard.press("Shift+Tab")

    await expect.poll(() => toolbarHasFocus(page)).toBe(true)
    await expect(page.locator("lexxy-toolbar")).toBeInViewport()
  })
  test("an arrow key scrolls a menu item clipped by its scrolling menu into view", async ({ page }) => {
    await page.addStyleTag({ content: "lexxy-toolbar [data-dropdown-panel] { max-block-size: 4rem; overflow: auto; }" })
    const trigger = page.locator("lexxy-toolbar button[name='format']")
    await focusInPlace(trigger)
    await page.keyboard.press("Enter")
    await expect.poll(() => toolbarHasFocus(page)).toBe(true)

    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowDown")

    const focused = page.locator("lexxy-toolbar [data-dropdown-panel] :focus")
    await expect(focused).toHaveCount(1)
    await expect(focused).toBeInViewport({ ratio: 1 })
  })
})

test.describe("Shift+Tab inside an attachment", () => {
  const linkAttachment = (n) => `<div><bc-attachment sgid="test-sgid-${n}" content-type="application/vnd.basecamp.opengraph-embed" content="&lt;a href=&quot;https://example.com/${n}&quot;&gt;Link ${n}&lt;/a&gt;"></bc-attachment></div>`

  test("moves to the previous link, not the toolbar", async ({ page, editor, browserName }) => {
    test.skip(browserName === "firefox", "Firefox doesn't let links inside the editable text take focus")
    await page.goto("/attachments-unset-permitted-list.html")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await editor.setValue(`<p>Before</p>${linkAttachment(1)}${linkAttachment(2)}`)
    await editor.flush()

    const second = editor.content.locator("a", { hasText: "Link 2" })
    await second.focus()
    await expect(second).toBeFocused()

    await page.keyboard.press("Shift+Tab")

    await expect(editor.content.locator("a", { hasText: "Link 1" })).toBeFocused()
  })
})
