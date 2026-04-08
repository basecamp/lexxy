import { readFileSync } from "node:fs"
import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml } from "../../helpers/assertions.js"
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

  test("paste rendered Lexxy mention preserves mention", async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    // Simulate pasting a mention copied from a rendered Lexxy view (e.g., a
    // posted Fizzy comment). The content attribute contains raw HTML — the same
    // format Trix/ActionText uses and Lexxy now exports.
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

test.describe("Paste — Blockquote", () => {
  test("pasting plain text with newlines into an empty blockquote keeps all lines inside the quote", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    // Reproduce the exact user flow from the bug report:
    // 1. Click Quote button to enter blockquote mode
    // 2. Paste plain text with newlines (console output)
    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    await editor.paste("this \nis\nwhat\n\nI am pasting")
    await editor.flush()

    // ALL pasted text must remain inside the blockquote — nothing should
    // escape to a paragraph outside the quote.
    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toHaveCount(1)
      const outerParagraphs = content.locator(":scope > p")
      await expect(outerParagraphs).toHaveCount(0)
    })
  })

  test("pasting HTML with multiple paragraphs into a blockquote keeps all inside", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    // Paste HTML with paragraph-level structure (common when copying from web pages)
    await editor.paste("line one\nline two\nline three", {
      html: "<p>line one</p><p>line two</p><p>line three</p>",
    })
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toHaveCount(1)
      const outerParagraphs = content.locator(":scope > p")
      await expect(outerParagraphs).toHaveCount(0)
    })
  })

  test("pasting HTML with headings and code blocks into a blockquote keeps all inside", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    // Paste HTML with heading and code block elements (common when copying from docs/READMEs)
    await editor.paste("heading\nsome code\nparagraph", {
      html: "<h1>heading</h1><pre><code>some code</code></pre><p>paragraph</p>",
    })
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toHaveCount(1)
      const outerParagraphs = content.locator(":scope > p")
      await expect(outerParagraphs).toHaveCount(0)
      const outerHeadings = content.locator(":scope > h1, :scope > h2, :scope > h3")
      await expect(outerHeadings).toHaveCount(0)
      const outerCode = content.locator(":scope > pre")
      await expect(outerCode).toHaveCount(0)
    })
  })

  test("pasting plain text into blockquote with existing content keeps all inside", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    // Set up a blockquote with existing text
    await editor.setValue("<blockquote><p>Already quoted</p></blockquote>")
    await editor.focus()
    await editor.send("End")
    await editor.flush()

    await editor.paste("this \nis\nwhat\n\nI am pasting")
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("blockquote")).toHaveCount(1)
      const outerParagraphs = content.locator(":scope > p")
      await expect(outerParagraphs).toHaveCount(0)
    })
  })
})

const modifier = process.platform === "darwin" ? "Meta" : "Control"

test.describe("Paste — Cut and paste", () => {
  test("cut and paste does not duplicate content", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.send("Hello world")
    await editor.flush()

    await editor.selectAll()
    await editor.content.press(`${modifier}+x`)
    await editor.flush()

    await editor.content.press(`${modifier}+v`)
    await editor.flush()

    await assertEditorHtml(editor, "<p>Hello world</p>")
  })
})
