import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Editor accessibility", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/editor-accessibility.html")
    await editor.waitForConnected()
  })

  test("reflects required on the textbox and follows changes", async ({ page, editor }) => {
    await expect(editor.content).toHaveAttribute("aria-required", "true")

    await page.getByLabel("Required", { exact: true }).uncheck()
    await expect(editor.content).toHaveAttribute("aria-required", "false")

    await page.getByLabel("Required", { exact: true }).check()
    await expect(editor.content).toHaveAttribute("aria-required", "true")
  })

  test("updates ARIA attributes and restores the label when an override is removed", async ({ page, editor }) => {
    await expect(editor.content).toHaveAccessibleName("Compose")
    await expect(editor.content).toHaveAccessibleDescription("Include the details.")

    await page.getByRole("button", { name: "Update details" }).click()
    await expect(editor.content).toHaveAccessibleName("Reply")
    await expect(editor.content).toHaveAccessibleDescription("Describe your reply.")
    await expect(editor.content).toHaveAttribute("aria-description", "Updated description")

    await page.getByRole("button", { name: "Clear details" }).click()
    await expect(editor.content).toHaveAccessibleName("Message")
    await expect(editor.content).not.toHaveAttribute("aria-describedby")
    await expect(editor.content).not.toHaveAttribute("aria-description")
  })

  test("exposes single-line editing as a single-line textbox", async ({ page, editor }) => {
    await page.goto("/single-line.html")
    await editor.waitForConnected()

    await expect(editor.content).toHaveAttribute("aria-multiline", "false")
  })

  test("uses the configured multiline mode when reconnecting", async ({ editor }) => {
    await expect(editor.content).toHaveAttribute("aria-multiline", "true")

    await editor.locator.evaluate(element => {
      const parent = element.parentElement
      element.remove()
      element.setAttribute("multi-line", "false")
      parent.append(element)
    })
    await editor.waitForConnected()
    await expect(editor.content).toHaveAttribute("aria-multiline", "false")

    await editor.locator.evaluate(element => element.setAttribute("aria-label", "Reconnected editor"))
    await expect(editor.content).toHaveAccessibleName("Reconnected editor")
  })

  test("preserves explicit ARIA states and restores defaults when they are removed", async ({ page, editor }) => {
    await editor.locator.evaluate(element => {
      element.setAttribute("aria-required", "false")
      element.setAttribute("aria-multiline", "false")
      element.setAttribute("aria-invalid", "spelling")
    })
    await page.getByLabel("Required", { exact: true }).uncheck()
    await page.getByLabel("Required", { exact: true }).check()
    await editor.send("A reply")

    await expect(editor.content).toHaveAttribute("aria-required", "false")
    await expect(editor.content).toHaveAttribute("aria-multiline", "false")
    await expect(editor.content).toHaveAttribute("aria-invalid", "spelling")

    await editor.locator.evaluate(element => {
      element.removeAttribute("aria-required")
      element.removeAttribute("aria-multiline")
      element.removeAttribute("aria-invalid")
    })
    await expect(editor.content).toHaveAttribute("aria-required", "true")
    await expect(editor.content).toHaveAttribute("aria-multiline", "true")
    await expect(editor.content).toHaveAttribute("aria-invalid", "false")
  })

  test("updates labelledby without losing the fallback name", async ({ editor }) => {
    await editor.locator.evaluate(element => element.setAttribute("aria-labelledby", "reply-help"))
    await expect(editor.content).toHaveAccessibleName("Describe your reply.")

    await editor.locator.evaluate(element => element.removeAttribute("aria-labelledby"))
    await expect(editor.content).toHaveAccessibleName("Compose")
  })

  test("preserves the active prompt suggestion when other ARIA attributes change", async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()
    await editor.send("@")
    await expect(page.getByRole("option", { name: "Zacharias" })).toBeVisible()

    const activeSuggestion = await editor.content.getAttribute("aria-activedescendant")
    expect(activeSuggestion).toBeTruthy()
    await editor.locator.evaluate(element => element.setAttribute("aria-label", "Mention a person"))
    await expect(editor.content).toHaveAccessibleName("Mention a person")
    await expect(editor.content).toHaveAttribute("aria-activedescendant", activeSuggestion)

    await editor.send("ArrowDown", "Enter")
    await expect(editor.content).toContainText("Alice")
    await expect(editor.content).not.toHaveAttribute("aria-activedescendant")
  })

  test("exposes validation errors after submission and clears them on correction or reset", async ({ page, editor }) => {
    await expect.poll(() => editor.locator.evaluate(element => element.validity.valueMissing)).toBe(true)
    await expect(editor.content).not.toHaveAttribute("aria-invalid", "true")

    await page.getByRole("button", { name: "Submit", exact: true }).click()
    await expect(editor.content).toHaveAttribute("aria-invalid", "true")

    await editor.send("A reply")
    await expect(editor.content).toHaveAttribute("aria-invalid", "false")

    await editor.selectAll()
    await editor.send("Backspace")
    await expect(editor.content).toHaveAttribute("aria-invalid", "true")

    await page.getByRole("button", { name: "Reset", exact: true }).press("Enter")
    await expect(editor.content).not.toHaveAttribute("aria-invalid", "true")
  })

  test("exposes errors reported through the form validation API", async ({ editor }) => {
    await expect.poll(() => editor.locator.evaluate(element => element.validity.valueMissing)).toBe(true)
    await editor.locator.evaluate(element => element.reportValidity())
    await expect(editor.content).toHaveAttribute("aria-invalid", "true")

    await editor.locator.evaluate(element => element.setAttribute("aria-invalid", "false"))
    await editor.locator.evaluate(element => element.reportValidity())
    await expect(editor.content).toHaveAttribute("aria-invalid", "false")

    await editor.locator.evaluate(element => element.removeAttribute("aria-invalid"))
    await expect(editor.content).toHaveAttribute("aria-invalid", "true")
  })
})
