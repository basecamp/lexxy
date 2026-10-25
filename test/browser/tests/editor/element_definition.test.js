import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { EditorHandle } from "../../helpers/editor_handle.js"

test("defines the elements before the next task when configure() follows the import", async ({ page, editor }) => {
  await page.goto("/configure-after-import.html")
  await editor.waitForConnected()

  expect(await page.evaluate(() => window.definedBeforeNextTask)).toBe(true)
  expect(await editor.locator.evaluate((el) => el.supportsAttachments)).toBe(false)
})

// Without a configure() call right after the import, Lexxy waits for the next task to define its elements, so editors
// already on the page still get a configuration that comes later. Each page configures a custom attachment tag, a
// default option and a preset.
const latePages = {
  "in a later module script": "/configure-in-later-script.html",
  "after a top-level await": "/configure-after-top-level-await.html",
  "after a dynamic import": "/configure-after-dynamic-import.html"
}

for (const [ description, path ] of Object.entries(latePages)) {
  test(`editors use a configuration that comes ${description}`, async ({ page }) => {
    const mention = new EditorHandle(page, "#mention")

    await page.goto(path)
    for (const id of [ "mention", "plain", "simple" ]) {
      await new EditorHandle(page, `#${id}`).waitForConnected()
    }

    await expect(mention.content.locator("bc-attachment")).toHaveCount(1)
    expect(await page.locator("#plain").evaluate((el) => el.supportsAttachments)).toBe(false)
    expect(await page.locator("#simple").evaluate((el) => el.supportsRichText)).toBe(false)
  })
}
