import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Turbo clones the DOM one event loop tick after dispatching `turbo:before-cache`,
// so the snapshot carries whatever the editor has built by then.
const cacheAndRestoreSnapshot = (page) => page.evaluate(async () => {
  document.dispatchEvent(new Event("turbo:before-cache"))
  await new Promise((resolve) => setTimeout(resolve, 0))

  const snapshot = document.body.cloneNode(true)
  document.body.replaceWith(snapshot)
})

test.describe("Turbo caching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("restoring a cached snapshot rebuilds a single, editable editor", async ({ page, editor }) => {
    await editor.focus()
    await editor.send("Hello")

    await cacheAndRestoreSnapshot(page)

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
