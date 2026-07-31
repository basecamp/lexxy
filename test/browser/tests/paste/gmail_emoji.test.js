import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

function gmailEmojiImg(emoji, { alt = emoji, src = "https://fonts.gstatic.com/s/e/notoemoji/17.0/1f602/32.png" } = {}) {
  return `<img data-emoji="${emoji}" class="an1" alt="${alt}" aria-label="${emoji}" draggable="false" src="${src}" loading="lazy" style="height: 1.2em; width: 1.2em; vertical-align: middle;">`
}

async function pasteHtml(page, editor, html) {
  await page.goto("/")
  await editor.waitForConnected()
  startMonitoringConsole(page)

  await editor.setValue("<p></p>")
  await editor.focus()

  await editor.paste("ignored", { html })
  await editor.flush()
}

test.describe("Paste Gmail emoji images", () => {
  test("replaces a Gmail emoji image with the emoji character", async ({ page, editor }) => {
    await pasteHtml(page, editor, `<p>Hello ${gmailEmojiImg("😂")} world</p>`)

    await assertEditorHtml(editor, "<p>Hello 😂 world</p>")
    expect(page).toHaveNoErrors()
  })

  test("replaces multiple Gmail emoji images in the same paste", async ({ page, editor }) => {
    await pasteHtml(page, editor, `<p>${gmailEmojiImg("😂")} and ${gmailEmojiImg("👍")}</p>`)

    await assertEditorHtml(editor, "<p>😂 and 👍</p>")
    expect(page).toHaveNoErrors()
  })

  test("keeps an image whose alt doesn't match its data-emoji", async ({ page, editor }) => {
    await pasteHtml(page, editor, `<p>Hello ${gmailEmojiImg("😂", { alt: "not an emoji" })}</p>`)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("img")).toHaveCount(1)
    })
    expect(page).toHaveNoErrors()
  })
})
