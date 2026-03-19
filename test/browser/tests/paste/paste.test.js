import { readFileSync } from "node:fs"
import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

const EXAMPLE_PNG = readFileSync("test/fixtures/files/example.png").toString(
  "base64",
)

test.describe("Paste — Files & Attachments", () => {
  test("prefer pasted image files over copied image html", async ({
    page,
    editor,
  }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    await mockActiveStorageUploads(page)
    await editor.locator.evaluate((el) => {
      const originalUploadFiles = el.contents.uploadFiles.bind(el.contents)
      window.__uploadFilesCalls = []

      el.contents.uploadFiles = (files, options) => {
        window.__uploadFilesCalls.push({
          names: Array.from(files).map((file) => file.name),
          selectLast: options?.selectLast,
        })

        return originalUploadFiles(files, options)
      }
    })

    await editor.paste("", {
      html: '<img src="https://example.com/copied-image.png">',
      files: [
        {
          base64: EXAMPLE_PNG,
          name: "copied-image.png",
          type: "image/png",
        },
      ],
    })

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator('img[src="https://example.com/copied-image.png"]'),
      ).toHaveCount(0)
    })

    await expect
      .poll(() => page.evaluate(() => window.__uploadFilesCalls))
      .toEqual([
        {
          names: [ "copied-image.png" ],
          selectLast: true,
        },
      ])
  })

  test("paste Lexxy mention from rendered view preserves mention correctly", async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    // Simulate copying a mention from a rendered Lexxy view (e.g., a posted
    // Basecamp/Fizzy comment) and pasting it into a Lexxy editor.
    //
    // Legacy format: older versions of exportDOM() JSON-encoded innerHtml into
    // the content attribute (content=JSON.stringify(innerHtml)). Server-side
    // HTML rendering (e.g., Rails/Nokogiri) would then double-encode the
    // entities in this attribute, so \" became &amp;quot; instead of &quot;.
    // When a user copies from a page with this legacy format, the clipboard
    // HTML has double-encoded entities. The parser must handle this gracefully
    // by decoding entities before retrying JSON.parse.
    //
    // This test uses the actual legacy format observed in Fizzy's rendered HTML
    // to ensure backward compatibility with already-persisted content.
    const mentionHtml = [
      '<action-text-attachment',
      ' sgid="test-sgid-lexxy"',
      ' content-type="application/vnd.actiontext.mention"',
      // This is the format from Fizzy's rendered HTML: the JSON content
      // attribute has been double-entity-encoded by the server's HTML
      // serializer. The original JSON.stringify output has \" for embedded
      // quotes. The server first encodes " as &quot;, then re-encodes
      // the & in &quot; as &amp;, producing \&amp;quot; in the HTML.
      // When the browser parses this, &amp; -> & and quot; stays literal,
      // so the attribute value becomes \&quot; (not \"). JSON.parse() fails
      // because \& is not a valid JSON escape.
      ' content="&amp;quot;&amp;lt;span class=\\&amp;quot;person person--inline\\&amp;quot;&amp;gt;&amp;lt;span class=\\&amp;quot;person--name\\&amp;quot;&amp;gt;Michael Berger&amp;lt;/span&amp;gt;&amp;lt;/span&amp;gt;&amp;quot;"',
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

  test("paste Trix mention HTML without crashing", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    const mentionHtml = [
      '<action-text-attachment',
      ' content-type="application/vnd.actiontext.mention"',
      ' sgid="test-sgid-123"',
      ' content="&lt;span class=&quot;person person--inline&quot;&gt;&lt;img src=&quot;/avatar.png&quot; class=&quot;person--avatar&quot; alt=&quot;&quot;&gt;&lt;span class=&quot;person--name&quot;&gt;Michael Berger&lt;/span&gt;&lt;/span&gt;"',
      '>Michael Berger</action-text-attachment>'
    ].join("")

    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.paste("Michael Berger", { html: mentionHtml })
    await page.waitForTimeout(500)

    expect(errors).toHaveLength(0)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("action-text-attachment")).toHaveCount(1)
    })
  })
})
