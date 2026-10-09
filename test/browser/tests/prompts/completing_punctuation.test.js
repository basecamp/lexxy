import { test } from "../../test_helper.js"
import { EditorHandle } from "../../helpers/editor_handle.js"
import { expect } from "@playwright/test"

const UNFILTERED_ITEMS_HTML = `
  <lexxy-prompt-item search="Alpha" sgid="test-sgid-alpha">
    <template type="menu"><span>Alpha</span></template>
    <template type="editor"><span>Alpha</span></template>
  </lexxy-prompt-item>
  <lexxy-prompt-item search="Beta" sgid="test-sgid-beta">
    <template type="menu"><span>Beta</span></template>
    <template type="editor"><span>Beta</span></template>
  </lexxy-prompt-item>
`

const FILTERED_ITEMS_HTML = `
  <lexxy-prompt-item search="Q4: Planning" sgid="test-sgid-q4-planning">
    <template type="menu"><span>Q4: Planning</span></template>
    <template type="editor"><span>Q4: Planning</span></template>
  </lexxy-prompt-item>
`

const ITEMS_WITHOUT_SEARCH_HTML = `
  <lexxy-prompt-item sgid="test-sgid-card-one">
    <template type="menu"><span>Card One</span></template>
    <template type="editor"><span>Card One</span></template>
  </lexxy-prompt-item>
`

test.describe("Completing punctuation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-filtering.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  for (const punctuation of [ ".", ",", "!", "?", ";", ":", ")" ]) {
    test(`${punctuation} selects the focused option and follows the mention without a space`, async ({ page, editor }) => {
      const popover = await openPrompt(page, editor, "Thanks @")

      await editor.send("Jack")
      await expect(popover.locator(".lexxy-prompt-menu__item")).toHaveCount(2)

      await editor.send(punctuation)
      await editor.send(" ok")

      await expect(popover).not.toBeVisible()
      await expect(editor.content.locator("action-text-attachment")).toHaveCount(1)
      expect(await editor.plainTextValue()).toBe(`Thanks Jack Franklin${punctuation} ok`)
    })
  }

  test("an apostrophe keeps a possessive after the mention", async ({ page, editor }) => {
    const popover = await openPrompt(page, editor, "@")

    await editor.send("Jack")
    await expect(popover.locator(".lexxy-prompt-menu__item")).toHaveCount(2)

    await editor.send("'s turn")

    expect(await editor.plainTextValue()).toBe("Jack Franklin's turn")
  })

  test("punctuation keeps the text that follows the cursor", async ({ page, editor }) => {
    await editor.send("Thanks  ok")
    await editor.send("ArrowLeft", "ArrowLeft", "ArrowLeft")
    const popover = await openPrompt(page, editor, "@")

    await editor.send("Jack")
    await expect(popover.locator(".lexxy-prompt-menu__item")).toHaveCount(2)

    await editor.send(",")

    expect(await editor.plainTextValue()).toBe("Thanks Jack Franklin, ok")
  })

  test("punctuation that continues a shown option keeps filtering", async ({ page, editor }) => {
    const popover = await openPrompt(page, editor, "@")
    const items = popover.locator(".lexxy-prompt-menu__item")

    await editor.send("O")
    await expect(items).toHaveText([ "Anne-Marie O'Connor" ])

    await editor.send("'")
    await editor.send("Connor")
    await expect(items).toHaveText([ "Anne-Marie O'Connor" ])

    await editor.send("Enter")

    expect(await editor.plainTextValue()).toBe("Anne-Marie O'Connor")
  })

  test("a curly apostrophe continues an option spelled with a straight one", async ({ page, editor }) => {
    const popover = await openPrompt(page, editor, "@")
    const items = popover.locator(".lexxy-prompt-menu__item")

    await editor.send("O")
    await expect(items).toHaveText([ "Anne-Marie O'Connor" ])

    await editor.content.dispatchEvent("keydown", { key: "’", bubbles: true, cancelable: true })
    await page.keyboard.insertText("’")
    await editor.send("Connor")
    await expect(items).toHaveText([ "Anne-Marie O'Connor" ])
    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)
  })

  test("punctuation right after the trigger selects the focused option", async ({ page, editor }) => {
    await openPrompt(page, editor, "Hi @")

    await editor.send("'")

    expect(await editor.plainTextValue()).toBe("Hi Anne-Marie O'Connor'")
  })

  test("punctuation pressed with a modifier key does not select", async ({ page, editor }) => {
    const popover = await openPrompt(page, editor, "@")

    await editor.send("Jack")
    await expect(popover.locator(".lexxy-prompt-menu__item")).toHaveCount(2)

    await editor.content.press("Control+.")
    await editor.flush()

    await expect(popover).toBeVisible()
    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)
  })

  test("punctuation with nothing found closes the prompt and keeps the text", async ({ page, editor }) => {
    const popover = await openPrompt(page, editor, "@")

    await editor.send("Zed")
    await expect(popover.locator(".lexxy-prompt-menu__item--empty")).toBeVisible()

    await editor.send("!")

    await expect(popover).not.toBeVisible()
    expect(await editor.plainTextValue()).toBe("@Zed!")
  })
})

test.describe("Completing punctuation with editable text", () => {
  test("punctuation follows the inserted text without a space", async ({ page, editor }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")

    const popover = await openPrompt(page, editor, "#")

    await editor.send("Ja")
    await expect(popover.locator(".lexxy-prompt-menu__item")).toHaveText([ "Jane" ])

    await editor.send(".")

    expect(await editor.plainTextValue()).toBe("Jane.")
  })
})

test.describe("Completing punctuation with a punctuation trigger", () => {
  test("the trigger character keeps filtering instead of selecting", async ({ page }) => {
    await page.goto("/prompt-only-at.html")
    const editor = new EditorHandle(page, "[data-editor='start-of-input'] lexxy-editor")
    await editor.waitForConnected()
    const popover = page.locator("[data-editor='start-of-input'] .lexxy-prompt-menu--visible")

    await editor.send("!")
    await expect(popover).toBeVisible({ timeout: 5_000 })
    await editor.send("opus")
    await expect(popover.locator(".lexxy-prompt-menu__item")).toHaveCount(1)

    await editor.send("!")

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)
    expect(await editor.plainTextValue()).toBe("!opus!")
  })
})

test.describe("Completing punctuation with a remote-filtering source", () => {
  test("punctuation typed before the results arrive does not select a stale option", async ({ page, editor }) => {
    let releaseResults
    const resultsReleased = new Promise((resolve) => { releaseResults = resolve })

    await page.route("**/prompt-items**", async (route) => {
      const filter = new URL(route.request().url()).searchParams.get("filter")
      if (filter) {
        await resultsReleased
        await route.fulfill({ contentType: "text/html", body: FILTERED_ITEMS_HTML })
      } else {
        await route.fulfill({ contentType: "text/html", body: UNFILTERED_ITEMS_HTML })
      }
    })

    await page.goto("/prompt-hash-remote-filter.html")
    await page.waitForSelector("lexxy-editor[connected]")

    const popover = await openPrompt(page, editor, "#")
    const items = popover.locator(".lexxy-prompt-menu__item")
    await expect(items).toHaveText([ "Alpha", "Beta" ])

    await editor.send("Q4: plan")
    releaseResults()
    await expect(items).toHaveText([ "Q4: Planning" ])

    await editor.send("Enter")

    await expect(editor.content.locator("action-text-attachment")).toHaveText("Q4: Planning")
  })

  test("punctuation selects an option that has no search text", async ({ page, editor }) => {
    await page.route("**/prompt-items**", async (route) => {
      await route.fulfill({ contentType: "text/html", body: ITEMS_WITHOUT_SEARCH_HTML })
    })

    await page.goto("/prompt-hash-remote-filter.html")
    await page.waitForSelector("lexxy-editor[connected]")

    const popover = await openPrompt(page, editor, "#")
    await editor.send("Card")
    await expect(popover.locator(".lexxy-prompt-menu__item")).toHaveText([ "Card One" ])

    await editor.send(",")

    await expect(editor.content.locator("action-text-attachment")).toHaveText("Card One")
    expect(await editor.plainTextValue()).toBe("Card One,")
  })
})

async function openPrompt(page, editor, text) {
  await editor.send(text)

  const popover = page.locator(".lexxy-prompt-menu--visible")
  await expect(popover).toBeVisible({ timeout: 5_000 })
  return popover
}
