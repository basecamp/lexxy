import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const PROMPT_ITEMS_HTML = `
  <lexxy-prompt-item search="Zacharias" sgid="test-sgid-zacharias">
    <template type="menu">
      <span class="person person--prompt-item">
        <span class="person--name">Zacharias</span>
      </span>
    </template>
    <template type="editor">
      <span class="person person--inline">
        <span class="person--name">Zacharias</span>
      </span>
    </template>
  </lexxy-prompt-item>
  <lexxy-prompt-item search="Alice" sgid="test-sgid-alice">
    <template type="menu">
      <span class="person person--prompt-item">
        <span class="person--name">Alice</span>
      </span>
    </template>
    <template type="editor">
      <span class="person person--inline">
        <span class="person--name">Alice</span>
      </span>
    </template>
  </lexxy-prompt-item>
`

test.describe("# prompt freeze with deferred source", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/prompt-items**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 75))
      await route.fulfill({
        contentType: "text/html",
        body: PROMPT_ITEMS_HTML,
      })
    })

    await page.goto("/prompt-hash-deferred.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("space pressed during deferred popover load does not freeze editor", async ({ page, editor }) => {
    // Type # to trigger the prompt (deferred source starts loading)
    await editor.send("#")
    await editor.flush()
    // Press SPACE before the deferred popover appears (during the 300ms fetch)
    // This triggers the markdown heading shortcut: "# " -> h1
    await editor.content.press("Space")
    await page.waitForTimeout(100)

    // The popover should NOT be visible since # was consumed by the heading shortcut
    const popoverVisible = await page.evaluate(() =>
      !!document.querySelector(".lexxy-prompt-menu--visible")
    )
    expect(popoverVisible, "Popover should not be visible after trigger was consumed").toBe(false)

    // The editor should accept typing
    await page.keyboard.type("hello")
    await page.waitForTimeout(100)

    const text = await page.evaluate(() =>
      document.querySelector(".lexxy-editor__content").textContent
    )
    expect(text).toContain("hello")
  })
})
