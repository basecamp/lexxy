import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const PROMPT_ITEMS_HTML = `
  <lexxy-prompt-item search="Peter Johnson" sgid="test-sgid-peter">
    <template type="menu"><span class="card-ref">Peter Johnson</span></template>
    <template type="editor"><span class="card-ref">Peter Johnson</span></template>
  </lexxy-prompt-item>
`

test.describe("Prompt with supports-space-in-searches keeps multi-word terms open", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/prompt-items**", async (route) => {
      await route.fulfill({ contentType: "text/html", body: PROMPT_ITEMS_HTML })
    })

    await page.goto("/prompt-hash-remote-filter.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("keeps the popover open when the search term contains a space", async ({ page, editor }) => {
    await editor.send("#")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.send("peter johnson")
    await editor.flush()

    await expect(popover).toBeVisible()
    await expect(popover).toContainText("Peter Johnson")
  })
})
