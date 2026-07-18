import { readFileSync } from "node:fs"
import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml, assertEditorPlainText } from "../../helpers/assertions.js"
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

test.describe("Paste — Plain text with angle brackets", () => {
  // Regression for BC-10106313690: pasting plain text containing a bare
  // "<...>" sequence (e.g. a WEBVTT speaker tag) dropped the tag because
  // marked() parsed it as raw inline HTML that the Lexical importer unwrapped.
  test("pasting plain text with a WEBVTT speaker tag preserves the tag", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("<v Nabila Abdel Nabi> Hello everyone, welcome.")

    await assertEditorPlainText(editor, "<v Nabila Abdel Nabi> Hello everyone, welcome.")
  })

  // Negative control: normal Markdown must still be interpreted, and a "<" used
  // as a comparison operator must survive — the fix stays surgical.
  test("pasting Markdown with a bare < comparison still formats and keeps the <", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("**bold** and a < b comparison")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("strong")).toHaveText("bold")
    })
    await assertEditorPlainText(editor, "bold and a < b comparison")
  })

  // Negative control: CommonMark autolinks wrap the URL in angle brackets, but
  // the character after the "tag name" is ":" (or "@" for emails), never a tag
  // boundary — so the unknown-tag escape must leave them alone and let marked()
  // turn them into links.
  test("pasting Markdown with an angle-bracket autolink still creates a link", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("see <https://example.com> please")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator('a[href="https://example.com"]')).toHaveCount(1)
    })
  })

  // Regression: the unknown-tag escape must not run inside Markdown code, where
  // marked() already preserves "<...>" literally. Escaping it there would import
  // the code span as "&lt;v Name>" instead of the "<v Name>" the user pasted.
  test("pasting Markdown with an unknown tag inside an inline code span keeps it literal", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("run `<v Name>` here")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toHaveText("<v Name>")
    })
    await assertEditorPlainText(editor, "run <v Name> here")
  })

  // Regression: same guarantee for fenced code blocks — literal tokens inside a
  // code fence must survive verbatim, not get rewritten to "&lt;...".
  test("pasting a fenced code block with HTML-like tokens keeps them literal", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("```\n<foo>\n<v Speaker>\n```")

    await assertEditorContent(editor, async (content) => {
      const code = content.locator("code")
      await expect(code).toHaveCount(1)
      await expect(code).toContainText("<foo>")
      await expect(code).toContainText("<v Speaker>")
      await expect(code).not.toContainText("&lt;")
    })
  })

  // Regression: the code-preserving pass must reach code spans nested inside a
  // list item, not just top-level code. A naive walk that only recurses a
  // token's `.tokens` misses list `.items[]` and escapes the item's raw wholesale,
  // importing the code span as "&lt;v Name>" instead of the literal "<v Name>".
  test("pasting a list item with an unknown tag inside an inline code span keeps it literal", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("- `<v Name>`")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("li code")).toHaveText("<v Name>")
      await expect(content.locator("code")).not.toContainText("&lt;")
    })
  })

  // Negative control for the same list: an unknown tag in the item's *prose*
  // (not code) must still be escaped so it round-trips as literal text rather
  // than being unwrapped and dropped by the importer.
  test("pasting a list item with an unknown tag in prose keeps it as literal text", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("- plain <v Speaker> here")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("li")).toContainText("plain <v Speaker> here")
      await expect(content.locator("code")).toHaveCount(0)
    })
  })

  // Regression: code spans also nest inside table cells (`.header[]`/`.rows[][]`),
  // which carry no `.raw` and never live under `.tokens`. The walk must reach
  // them too. This also exercises the lexer-options fix: the protective pass
  // lexes with marked's defaults (gfm on) so it sees a real table token — the
  // same tree marked() renders — instead of a divergent paragraph fallback.
  test("pasting a table with an unknown tag inside a cell's code span keeps it literal", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("| Head | Two |\n| --- | --- |\n| `<v Cell>` | plain <v Prose> |")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(1)
      await expect(content.locator("td code")).toHaveText("<v Cell>")
      await expect(content.locator("code")).not.toContainText("&lt;")
      await expect(content.locator("td").filter({ hasText: "plain" })).toContainText("plain <v Prose>")
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
