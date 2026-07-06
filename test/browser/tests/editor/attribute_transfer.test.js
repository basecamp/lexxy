import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("autocapitalize", () => {
  test("transfers the editor's value to the content element", async ({ page, editor }) => {
    await page.goto("/attribute-transfer.html")
    await editor.waitForConnected()

    await expect(editor.content).toHaveAttribute("autocapitalize", "characters")
  })

  test("keeps the value on the editor so changes can be observed", async ({ page, editor }) => {
    await page.goto("/attribute-transfer.html")
    await editor.waitForConnected()

    await expect(editor.locator).toHaveAttribute("autocapitalize", "characters")
  })

  test("leaves the content element unset when the editor has no value", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await expect(editor.content).not.toHaveAttribute("autocapitalize")
  })

  test("synchronizes later changes to the content element", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.locator.evaluate((el) => el.setAttribute("autocapitalize", "words"))

    await expect(editor.content).toHaveAttribute("autocapitalize", "words")
  })

  test("synchronizes removal to the content element", async ({ page, editor }) => {
    await page.goto("/attribute-transfer.html")
    await editor.waitForConnected()

    await editor.locator.evaluate((el) => el.removeAttribute("autocapitalize"))

    await expect(editor.content).not.toHaveAttribute("autocapitalize")
  })
})

test.describe("tabindex", () => {
  test("transfers the editor's value to the content element", async ({ page, editor }) => {
    await page.goto("/attribute-transfer.html")
    await editor.waitForConnected()

    await expect(editor.content).toHaveAttribute("tabindex", "3")
  })

  test("removes the value from the editor once transferred", async ({ page, editor }) => {
    await page.goto("/attribute-transfer.html")
    await editor.waitForConnected()

    await expect(editor.locator).not.toHaveAttribute("tabindex")
  })

  test("defaults the content element to 0 when the editor has no value", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await expect(editor.content).toHaveAttribute("tabindex", "0")
  })
})
