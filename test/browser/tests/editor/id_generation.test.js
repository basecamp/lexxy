import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("ID generation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("auto-generates an id when none is set", async ({ page }) => {
    const id = await page.locator("lexxy-editor").getAttribute("id")
    expect(id).toBeTruthy()
    expect(id).toMatch(/^lexxy-editor-.+/)
  })

  test("content element derives its id from the editor id", async ({ page }) => {
    const editorId = await page.locator("lexxy-editor").getAttribute("id")
    const contentId = await page.locator(".lexxy-editor__content").getAttribute("id")
    expect(contentId).toBe(`${editorId}-content`)
  })

  test("multiple editors get unique ids", async ({ page }) => {
    await page.evaluate(() => {
      const editor = document.createElement("lexxy-editor")
      editor.innerHTML = '<input type="hidden" value="">'
      document.body.appendChild(editor)
    })
    await page.waitForFunction(() =>
      document.querySelectorAll("lexxy-editor[connected]").length === 2
    )

    const ids = await page.locator("lexxy-editor").evaluateAll(
      editors => editors.map(e => e.id)
    )
    expect(ids[0]).toBeTruthy()
    expect(ids[1]).toBeTruthy()
    expect(ids[0]).not.toBe(ids[1])
  })

  test("preserves an explicit id", async ({ page }) => {
    await page.evaluate(() => {
      const editor = document.createElement("lexxy-editor")
      editor.id = "my-custom-id"
      editor.innerHTML = '<input type="hidden" value="">'
      document.body.appendChild(editor)
    })
    await page.waitForSelector("lexxy-editor#my-custom-id[connected]")

    const id = await page.locator("lexxy-editor#my-custom-id").getAttribute("id")
    expect(id).toBe("my-custom-id")
  })
})
