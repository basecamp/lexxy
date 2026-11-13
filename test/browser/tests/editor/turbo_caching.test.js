import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { selectAttachment } from "../../helpers/attachment_helpers.js"

// Turbo clones the DOM one event loop tick after dispatching `turbo:before-cache`,
// so the snapshot carries whatever the editor has built by then.
const cacheAndRestoreSnapshot = (page) => page.evaluate(async () => {
  document.dispatchEvent(new Event("turbo:before-cache"))
  await new Promise((resolve) => setTimeout(resolve, 0))

  const snapshot = document.body.cloneNode(true)
  document.body.replaceWith(snapshot)

  return snapshot.querySelector(".lexxy-editor__content").textContent
})

test.describe("Turbo caching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("restoring a cached snapshot rebuilds a single, editable editor", async ({ page, editor }) => {
    await editor.focus()
    await editor.send("Hello")

    expect(await cacheAndRestoreSnapshot(page)).toEqual("")

    const editorElement = page.locator("lexxy-editor")
    await expect(editorElement.locator(".lexxy-editor__content[data-lexical-editor]")).toHaveCount(1)
    await expect(editorElement.locator("lexxy-toolbar")).toHaveCount(1)
    await expect(editorElement.locator("lexxy-table-tools")).toHaveCount(1)
    await expect(editorElement.locator("lexxy-code-language-picker")).toHaveCount(1)

    await editor.focus()
    await editor.send("Restored")

    expect(await editor.plainTextValue()).toEqual("Restored")
  })
})

test.describe("Turbo caching without navigating", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("prompts keep opening", async ({ page, editor }) => {
    await page.evaluate(() => document.dispatchEvent(new Event("turbo:before-cache")))

    await editor.send("@")
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })
  })

  test("an open prompt closes and opens again on the next trigger", async ({ page, editor }) => {
    await editor.send("@")
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })

    await page.evaluate(() => document.dispatchEvent(new Event("turbo:before-cache")))
    await expect(page.locator(".lexxy-prompt-menu")).toHaveCount(0)
    await expect(editor.content).not.toHaveAttribute("aria-controls")

    await editor.send("Backspace")
    await editor.send("@")
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })
  })
})

test("restoring custom attachment controls does not duplicate ordinary attachment actions", async ({ page, editor }) => {
  await page.goto("/attachment-controls.html")
  await page.waitForSelector("lexxy-editor[connected]")
  const html = '<p>Before</p><action-text-attachment sgid="audio" content-type="audio/mpeg" filename="example.mp3" caption="Example"></action-text-attachment><action-text-attachment sgid="file" content-type="application/pdf" filename="example.pdf"></action-text-attachment><p>After</p>'
  await editor.locator.evaluate((element, value) => {
    element.setAttribute("value", value)
    element.value = value
  }, html)
  await expect(page.getByRole("button", { name: "Play Example", exact: true })).toBeVisible()

  for (let restore = 0; restore < 2; restore++) {
    await cacheAndRestoreSnapshot(page)
    await expect(page.getByRole("button", { name: "Play Example", exact: true })).toBeVisible()
    await selectAttachment(editor.content.locator("figure").filter({ hasText: "example.pdf" }))
    const remove = page.getByRole("button", { name: "Remove", exact: true })
    await expect(remove).toHaveCount(1)
    await page.keyboard.press("Alt+F10")
    await expect(remove).toBeFocused()
    await page.keyboard.press("Escape")
  }

  await selectAttachment(editor.content.locator("figure").filter({ hasText: "example.pdf" }))
  await page.keyboard.press("Alt+F10")
  await page.keyboard.press("Enter")
  await expect(editor.content.locator("figure").filter({ hasText: "example.pdf" })).toHaveCount(0)
  await page.getByRole("button", { name: "Play Example", exact: true }).click()
  await expect(page.getByRole("button", { name: "Pause Example", exact: true })).toBeFocused()
})
