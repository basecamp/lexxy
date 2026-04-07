import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

test.describe("Paste — XSS sanitization via action-text-attachment content", () => {
  test("sanitizes onerror XSS payload in content attribute", async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    // Listen for any dialog (alert) triggered by XSS
    let dialogTriggered = false
    page.on("dialog", async (dialog) => {
      dialogTriggered = true
      await dialog.dismiss()
    })

    const xssPayload = [
      '<action-text-attachment',
      ' content-type="text/html"',
      ' content="&quot;&lt;img src=x onerror=alert(document.domain)&gt;&quot;"',
      '>',
      '</action-text-attachment>'
    ].join("")

    await editor.paste("", { html: xssPayload })
    await editor.flush()
    await page.waitForTimeout(1000)

    // The XSS alert should not have fired
    expect(dialogTriggered).toBe(false)

    // The malicious img with onerror should not be present in the DOM
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("img[onerror]")).toHaveCount(0)
    })
  })

  test("sanitizes meta refresh HTML injection in content attribute", async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    const metaPayload = [
      '<action-text-attachment',
      ' content-type="text/html"',
      " content=\"&quot;&lt;meta http-equiv='refresh' content='1; http://evil.com'&gt;&quot;\"",
      '>',
      '</action-text-attachment>'
    ].join("")

    await editor.paste("", { html: metaPayload })
    await editor.flush()
    await page.waitForTimeout(500)

    // The meta tag should be stripped by sanitization
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("meta")).toHaveCount(0)
    })
  })

  test("sanitizes script tag in content attribute", async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    let dialogTriggered = false
    page.on("dialog", async (dialog) => {
      dialogTriggered = true
      await dialog.dismiss()
    })

    const scriptPayload = [
      '<action-text-attachment',
      ' content-type="text/html"',
      ' content="&lt;script&gt;alert(1)&lt;/script&gt;"',
      '>',
      '</action-text-attachment>'
    ].join("")

    await editor.paste("", { html: scriptPayload })
    await editor.flush()
    await page.waitForTimeout(1000)

    expect(dialogTriggered).toBe(false)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("script")).toHaveCount(0)
    })
  })

  test("preserves legitimate mention content through sanitization", async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    // A legitimate mention should still work after the fix
    const mentionHtml = [
      '<action-text-attachment',
      ' sgid="test-sgid-lexxy"',
      ' content-type="application/vnd.actiontext.mention"',
      ' content="&lt;span class=&quot;person person--inline&quot;&gt;&lt;span class=&quot;person--name&quot;&gt;Michael Berger&lt;/span&gt;&lt;/span&gt;"',
      '>',
      '<span class="person person--inline"><span class="person--name">Michael Berger</span></span>',
      '</action-text-attachment>'
    ].join("")

    await editor.paste("Michael Berger", { html: mentionHtml })
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("action-text-attachment")).toHaveCount(1)
      await expect(content.locator("action-text-attachment .person--name")).toHaveText("Michael Berger")
    })
  })
})
