import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

function collectPageErrors(page) {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  return errors
}

// A host app restoring a saved draft sets the editor's value while focus is elsewhere,
// such as a form's title field. A draft that ends in the trigger must not open the menu:
// with no cursor in the editor it would anchor at a meaningless spot and stay there.
test.describe("Prompt when a value ending in the trigger is restored", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()
    await page.locator("form").evaluate((form) => form.insertAdjacentHTML("afterbegin", "<input type='text' aria-label='Title'>"))
  })

  test("doesn't open the menu while focus is outside the editor", async ({ page, editor }) => {
    await page.getByRole("textbox", { name: "Title" }).focus()
    await editor.setValue("<p>Hi @</p>")
    await editor.flush()
    await page.waitForTimeout(200)

    await expect(page.locator(".lexxy-prompt-menu--visible")).toHaveCount(0)
  })

  test("opens the menu at the cursor when a mention is typed afterwards", async ({ page, editor }) => {
    const errors = collectPageErrors(page)
    await page.getByRole("textbox", { name: "Title" }).focus()
    await editor.setValue("<p>Hi @</p>")
    await editor.flush()

    await editor.click()
    await editor.send("End")
    await editor.send(" ")
    await editor.send("@")
    await editor.content.pressSequentially("Al")

    const menu = page.locator(".lexxy-prompt-menu--visible")
    await expect(menu).toBeVisible({ timeout: 5_000 })
    await expect(menu.locator(".lexxy-prompt-menu__item")).toHaveText([ "Alice" ])

    const caret = await page.evaluate(() => getSelection().getRangeAt(0).getBoundingClientRect())
    const menuBox = await menu.boundingBox()
    expect(Math.abs(menuBox.y - caret.bottom)).toBeLessThan(30)
    expect(Math.abs(menuBox.x - caret.left)).toBeLessThan(60)

    expect(errors).toEqual([])
  })

  test("typing the trigger in the focused editor still opens the menu", async ({ page, editor }) => {
    await editor.click()
    await editor.send("@")

    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })
  })
})
