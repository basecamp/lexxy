import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { EditorHandle } from "../../helpers/editor_handle.js"

// Lexxy defines its elements in a microtask after its module runs, so editors already on the page can start before
// a configure() call that comes later: from another module script, or after an await. Each page configures a custom
// attachment tag, a default option and a preset after that point, and its editors must still pick up all three.
const pages = {
  "in a later module script": "/configure-in-later-script.html",
  "after a top-level await": "/configure-after-top-level-await.html",
  "after a dynamic import": "/configure-after-dynamic-import.html"
}

const editorIds = [ "mention", "plain", "simple" ]

async function waitForEditors(page) {
  for (const id of editorIds) {
    await new EditorHandle(page, `#${id}`).waitForConnected()
  }
}

for (const [ description, path ] of Object.entries(pages)) {
  test.describe(`Configure ${description}`, () => {
    test("editors already on the page use the configuration", async ({ page }) => {
      const mention = new EditorHandle(page, "#mention")

      await page.goto(path)
      await waitForEditors(page)

      await expect(mention.content.locator("bc-attachment")).toHaveCount(1)
      expect(await mention.value()).toContain("<bc-attachment")

      expect(await page.locator("#plain").evaluate((el) => el.supportsAttachments)).toBe(false)
      await expect(page.locator("#plain lexxy-toolbar button[name='image']")).toBeHidden()

      expect(await page.locator("#simple").evaluate((el) => el.supportsRichText)).toBe(false)
      await expect(page.locator("#simple lexxy-toolbar")).toHaveCount(0)
    })

    test("rebuilt editors keep a single toolbar", async ({ page }) => {
      await page.goto(path)
      await waitForEditors(page)

      await expect(page.locator("#mention lexxy-toolbar")).toHaveCount(1)
      await expect(page.locator("#plain lexxy-toolbar")).toHaveCount(1)
      await expect(page.locator("#mention .lexxy-editor__content")).toHaveCount(1)
      await expect(page.locator("#plain .lexxy-editor__content")).toHaveCount(1)
    })
  })
}
