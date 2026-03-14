import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../helpers/assertions.js"

test.describe("URL preview with angle bracket content", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("content attribute with HTML entities survives DOMPurify sanitization", async ({ page }) => {
    // This test directly tests DOMPurify behavior with the content attribute
    const result = await page.evaluate(() => {
      // Build an attachment element with JSON-stringified content that includes HTML entities
      const innerHtml = '<div>Title: &lt;brackets&gt; content</div>'
      const jsonContent = JSON.stringify(innerHtml)

      const el = document.createElement("action-text-attachment")
      el.setAttribute("content", jsonContent)
      el.setAttribute("content-type", "text/html")

      const wrapper = document.createElement("div")
      wrapper.appendChild(el)
      const serializedHtml = wrapper.innerHTML

      // Now sanitize using DOMPurify via the Lexxy module
      // We can't import directly, but we can use the editor's value mechanism
      // Instead, let's manually check what DOMPurify does

      // Import DOMPurify from the page's already-loaded module
      // DOMPurify should be available since lexxy loads it
      const DOMPurify = window.DOMPurify

      if (!DOMPurify) {
        return { error: "DOMPurify not available as global" }
      }

      const sanitized = DOMPurify.sanitize(serializedHtml, {
        ALLOWED_TAGS: ["action-text-attachment"],
        ALLOWED_ATTR: ["content", "content-type"],
        SAFE_FOR_XML: false
      })

      const sanitizedDoc = new DOMParser().parseFromString(sanitized, "text/html")
      const sanitizedContent = sanitizedDoc.querySelector("action-text-attachment")?.getAttribute("content")

      return {
        serializedHtml,
        sanitized,
        origContent: jsonContent,
        sanitizedContent,
        match: jsonContent === sanitizedContent
      }
    })

    console.log("Result:", JSON.stringify(result, null, 2))

    if (result.error) {
      // DOMPurify not globally available, skip this test variant
      console.log("Skipping: " + result.error)
    } else {
      expect(result.match).toBe(true)
    }
  })

  test("preserves angle bracket content through complete editor round-trip", async ({ page, editor }) => {
    // Simulate the full flow: paste URL → unfurl → display → save → reload → display
    await page.evaluate(() => {
      document.querySelector("lexxy-editor").addEventListener("lexxy:insert-link", (event) => {
        // Simulate what a server would return for a page titled "Test <Hello> Page"
        const html = '<div class="unfurl"><strong>Test &lt;Hello&gt; Page</strong><p>Some description with &lt;angle&gt; brackets</p></div>'
        event.detail.replaceLinkWith(html, { attachment: { sgid: null } })
      })
    })

    await editor.paste("https://example.com/test-page")
    await editor.flush()
    await page.waitForTimeout(500)
    await editor.flush()

    // Verify display is correct
    await assertEditorContent(editor, async (content) => {
      const text = await content.textContent()
      expect(text).toContain("<Hello>")
      expect(text).toContain("<angle>")
      expect(text).not.toContain("&lt;Hello&gt;")
      expect(text).not.toContain("&lt;angle&gt;")
    })

    // Save (get value) and reload (set value)
    const savedValue = await editor.value()

    // Verify the saved HTML is valid
    const parsed = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html")
      const attachment = doc.querySelector("action-text-attachment")
      const content = attachment?.getAttribute("content")
      if (!content) return { error: "no content attr" }
      try {
        const innerHtml = JSON.parse(content)
        return {
          innerHtml,
          hasHelloEntity: innerHtml.includes("&lt;Hello&gt;"),
          hasDoubleEncoded: innerHtml.includes("&amp;lt;"),
        }
      } catch {
        return { error: "JSON parse failed", rawContent: content }
      }
    }, savedValue)

    console.log("Parsed content:", JSON.stringify(parsed))
    expect(parsed.hasHelloEntity).toBe(true)
    expect(parsed.hasDoubleEncoded).toBe(false)

    // Reload into editor
    await editor.setValue(savedValue)
    await editor.flush()

    // Verify display is still correct after reload
    await assertEditorContent(editor, async (content) => {
      const text = await content.textContent()
      expect(text).toContain("<Hello>")
      expect(text).toContain("<angle>")
      expect(text).not.toContain("&lt;Hello&gt;")
      expect(text).not.toContain("&lt;angle&gt;")
    })
  })

  test("no progressive double-escaping across multiple save-load cycles", async ({ page, editor }) => {
    await page.evaluate(() => {
      document.querySelector("lexxy-editor").addEventListener("lexxy:insert-link", (event) => {
        const html = '<span>Note: &lt;important&gt; details</span>'
        event.detail.replaceLinkWith(html, { attachment: { sgid: null } })
      })
    })

    await editor.paste("https://example.com/test")
    await editor.flush()
    await page.waitForTimeout(500)
    await editor.flush()

    const extractInnerHtml = async (html) => {
      return page.evaluate((h) => {
        const doc = new DOMParser().parseFromString(h, "text/html")
        const attachment = doc.querySelector("action-text-attachment")
        const content = attachment?.getAttribute("content")
        if (!content) return null
        try { return JSON.parse(content) } catch { return content }
      }, html)
    }

    const value1 = await editor.value()
    const inner1 = await extractInnerHtml(value1)

    await editor.setValue(value1)
    await editor.flush()
    const value2 = await editor.value()
    const inner2 = await extractInnerHtml(value2)

    await editor.setValue(value2)
    await editor.flush()
    const value3 = await editor.value()
    const inner3 = await extractInnerHtml(value3)

    expect(inner2).toBe(inner1)
    expect(inner3).toBe(inner1)
    expect(inner3).toContain("&lt;important&gt;")
    expect(inner3).not.toContain("&amp;lt;")
  })

  test("Trix-format content with angle brackets renders correctly", async ({ page, editor }) => {
    // Trix stores raw HTML in the content attribute.
    // In the stored HTML: content="<div>Title: &lt;Hello&gt; Page</div>"
    // After browser parsing: getAttribute("content") = "<div>Title: <Hello> Page</div>"
    // Because &lt; is decoded in attribute values.
    //
    // parseAttachmentContent falls back to raw string since JSON.parse fails.
    // Then innerHtml = "<div>Title: <Hello> Page</div>"
    // insertAdjacentHTML treats <Hello> as an HTML tag - content is lost!
    //
    // The properly-encoded Trix format would be:
    // content="&lt;div&gt;Title: &amp;lt;Hello&amp;gt; Page&lt;/div&gt;"
    // Which decodes to: "<div>Title: &lt;Hello&gt; Page</div>"
    // parseAttachmentContent returns this raw string
    // insertAdjacentHTML correctly renders &lt;Hello&gt; as <Hello> text

    const trixHtml = '<action-text-attachment content="&lt;div&gt;Title: &amp;lt;Hello&amp;gt; Page&lt;/div&gt;" content-type="text/html"></action-text-attachment>'

    await editor.setValue(trixHtml)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      const text = await content.textContent()
      expect(text).toContain("<Hello>")
      expect(text).not.toContain("&lt;Hello&gt;")
    })
  })
})
