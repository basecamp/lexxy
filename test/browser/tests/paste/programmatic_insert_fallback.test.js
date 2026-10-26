import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const ogEmbedHtml = '<div class="og-preview"><a href="https://example.com"><img src="/og-thumb.png" alt="">Title</a></div>'

test.describe("Programmatic insert falls back to plain HTML when content-type is disallowed", () => {
  test("disallowed attachment content-type via lexxy:insert-link falls back to plain HTML", async ({ page, editor }) => {
    await page.goto("/mentions-custom-element.html")
    await editor.waitForConnected()

    await page.evaluate((html) => {
      document.querySelector("lexxy-editor").addEventListener("lexxy:insert-link", (event) => {
        event.detail.replaceLinkWith(html, {
          attachment: {
            contentType: "application/vnd.basecamp.opengraph-embed",
            sgid: "test-sgid-embed",
          },
        })
      })
    }, ogEmbedHtml)

    await editor.paste("https://example.com")
    await editor.flush()

    // Structural invariants:
    //  (1) the fallback inserted content produces exactly one anchor,
    //  (2) that anchor has the input HTML's href, and
    //  (3) the anchor's only text content is "Title" — the nested <img> was stripped inside #createHtmlNodeWith
    const anchor = editor.content.locator("a")
    await expect(anchor).toHaveCount(1)
    await expect(anchor).toHaveAttribute("href", "https://example.com")
    await expect(anchor).toHaveText("Title")

    // Negative structural invariants: no attachment node, no <img> anywhere,
    // in either the live DOM or the serialized value.
    await expect(editor.content.locator("bc-attachment")).toHaveCount(0)
    await expect(editor.content.locator("img")).toHaveCount(0)

    const serialized = await editor.value()
    expect(serialized).not.toContain("bc-attachment")
    expect(serialized).not.toContain("<img")
    expect(serialized).not.toContain(`content-type="application/vnd.basecamp.opengraph-embed"`)
  })
})
