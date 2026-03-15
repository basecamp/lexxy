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

test.describe("Paste: text with line breaks into blockquote", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("pasting plain text with single line break keeps all text inside blockquote", async ({
    page,
    editor,
  }) => {
    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    await editor.paste("line one\nline two")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<blockquote><p>line one<br>line two</p></blockquote>",
    )
  })

  test("pasting plain text with multiple line breaks keeps all text inside blockquote", async ({
    page,
    editor,
  }) => {
    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    await editor.paste("line one\nline two\nline three")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<blockquote><p>line one<br>line two<br>line three</p></blockquote>",
    )
  })

  test("pasting plain text with paragraph breaks keeps all text inside blockquote", async ({
    page,
    editor,
  }) => {
    await editor.click()
    await page.getByRole("button", { name: "Quote" }).click()
    await editor.flush()

    await editor.paste("line one\n\nline two")
    await editor.flush()

    await assertEditorHtml(
      editor,
      "<blockquote><p>line one</p><p>line two</p></blockquote>",
    )
  })
})
