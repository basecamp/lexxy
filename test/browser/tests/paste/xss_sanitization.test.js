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

  test("strips onclick handler from bc-attachment wrapper while preserving sgid", async ({ page, editor }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")

    const mentionWithOnclick = `<div><bc-attachment onclick="alert(1)" sgid="test-sgid-alice" content-type="application/vnd.basecamp.mention" content="&lt;bc-mention class=&quot;mentionable-person&quot; gid=&quot;gid://test/Person/1&quot;&gt;&lt;span class=&quot;person--inline&quot;&gt;Alice&lt;/span&gt;&lt;/bc-mention&gt;"></bc-attachment></div>`

    await editor.setValue(mentionWithOnclick)
    await editor.flush()

    const attachment = editor.content.locator("bc-attachment[content-type='application/vnd.basecamp.mention']")
    await expect(attachment).toHaveCount(1)
    await expect(attachment).not.toHaveAttribute("onclick", /.*/)

    const serialized = await editor.value()
    expect(serialized).not.toContain("onclick")
    expect(serialized).toContain(`sgid="test-sgid-alice"`)
  })

  test("strips data-controller/data-action from bc-attachment content on every hydration", async ({ page, editor }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")

    const stimulusPayload = `<div><bc-attachment sgid="test-sgid-alice" content-type="application/vnd.basecamp.mention" content="&lt;span data-controller=&quot;content-loader&quot; data-action=&quot;click-&gt;content-loader#load&quot; class=&quot;person--inline&quot;&gt;Alice&lt;/span&gt;"></bc-attachment></div>`

    await editor.setValue(stimulusPayload)
    await editor.flush()

    // The attachment hydrates (createDOM -> insertAdjacentHTML(sanitize(...))) with the
    // Stimulus behavior attributes stripped from the live DOM.
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("[data-controller]")).toHaveCount(0)
      await expect(content.locator("[data-action]")).toHaveCount(0)
    })

    const attachment = editor.content.locator("bc-attachment[content-type='application/vnd.basecamp.mention']")
    await expect(attachment).toHaveCount(1)

    // The attachment's stored `content=` attribute is preserved verbatim on export — by
    // design (SAFE_FOR_XML: false), it round-trips as an opaque, HTML-entity-encoded string
    // rather than being torn apart. That string still contains the words "data-controller",
    // but it is inert: it is attribute-value text, not a live attribute, and it can only
    // become a DOM attribute again by flowing back through createDOM's sanitize() call.
    const serialized = await editor.value()
    expect(serialized).toContain("sgid=\"test-sgid-alice\"")

    // Prove that hydration strips the attribute every time, not just once: feed the
    // serialized round-trip payload back in and confirm the second hydration is equally clean.
    await editor.setValue(serialized)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("[data-controller]")).toHaveCount(0)
      await expect(content.locator("[data-action]")).toHaveCount(0)
    })
  })

  test("preserves data-language on code blocks through sanitization (no over-strip)", async ({ page, editor }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.setValue('<pre data-language="ruby"><code>puts "hi"</code></pre>')
    await editor.flush()

    // The highlight extension re-renders the block as <code data-language="ruby"> in the
    // live DOM; the exported/stored form keeps data-language on the <pre>. Either way,
    // FORBID_ATTR must not have touched a legitimate, non-Stimulus data-* attribute.
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code[data-language='ruby']")).toHaveCount(1)
    })

    const serialized = await editor.value()
    expect(serialized).toContain(`data-language="ruby"`)
  })

  test("preserves a legitimate mention alongside a stripped Stimulus attribute in the same document", async ({ page, editor }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")

    const mixedPayload = [
      '<div>',
      '<bc-attachment sgid="test-sgid-alice" content-type="application/vnd.basecamp.mention" content="&lt;bc-mention class=&quot;mentionable-person&quot; gid=&quot;gid://test/Person/1&quot;&gt;&lt;span class=&quot;person--inline&quot;&gt;Alice&lt;/span&gt;&lt;/bc-mention&gt;"></bc-attachment>',
      ' and ',
      '<bc-attachment sgid="test-sgid-jane" content-type="application/vnd.basecamp.mention" content="&lt;span data-controller=&quot;content-loader&quot; data-action=&quot;click-&gt;content-loader#load&quot;&gt;Jane&lt;/span&gt;"></bc-attachment>',
      '</div>',
    ].join("")

    await editor.setValue(mixedPayload)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("bc-attachment")).toHaveCount(2)
      await expect(content.locator("[data-controller]")).toHaveCount(0)
      await expect(content.locator("[data-action]")).toHaveCount(0)
      await expect(content.locator(".person--inline").first()).toHaveText("Alice")
    })
  })
})
