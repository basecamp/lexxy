import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const PROMPT_ITEMS_HTML = `
  <lexxy-prompt-item search="Card One" sgid="test-sgid-card-one">
    <template type="menu">Card One</template>
    <template type="editor">Card One</template>
  </lexxy-prompt-item>
`

function collectPageErrors(page) {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  return errors
}

test.describe("Prompt removed while a filter is pending", () => {
  test("Turbo caching the page before the debounced filter runs", async ({ page, editor }) => {
    const errors = collectPageErrors(page)
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    await editor.send("@")
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })

    await page.locator("lexxy-editor").evaluate((el) => {
      el.dispatchEvent(new CustomEvent("lexxy:change"))
      document.dispatchEvent(new Event("turbo:before-cache"))
    })
    await page.waitForTimeout(200)

    expect(errors).toEqual([])
  })

  test("prompt reconnecting before the debounced filter runs still opens on the next trigger", async ({ page, editor }) => {
    const errors = collectPageErrors(page)
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    await editor.send("@")
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })

    await page.locator("lexxy-editor").evaluate((el) => {
      el.dispatchEvent(new CustomEvent("lexxy:change"))
      el.querySelector("lexxy-prompt").removeAttribute("connected")
    })
    await page.waitForTimeout(200)

    expect(errors).toEqual([])
    await expect(page.locator(".lexxy-prompt-menu")).toHaveCount(0)

    await editor.send("Backspace")
    await editor.send("@")
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })
  })

  test("editor leaving the page while a remote filter is loading", async ({ page, editor }) => {
    const errors = collectPageErrors(page)
    let fulfillRequest
    await page.route("**/prompt-items**", async (route) => {
      if (new URL(route.request().url()).searchParams.get("filter")) {
        await new Promise((resolve) => { fulfillRequest = resolve })
      }
      await route.fulfill({ contentType: "text/html", body: PROMPT_ITEMS_HTML })
    })
    await page.goto("/prompt-hash-remote-filter.html")
    await editor.waitForConnected()

    await editor.send("#")
    await expect(page.locator(".lexxy-prompt-menu--visible")).toBeVisible({ timeout: 5_000 })

    await editor.content.pressSequentially("C")
    await expect.poll(() => fulfillRequest).toBeDefined()

    await page.locator("lexxy-editor").evaluate((el) => el.remove())
    fulfillRequest()
    await page.waitForTimeout(200)

    expect(errors).toEqual([])
  })
})
