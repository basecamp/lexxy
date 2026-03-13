import { readFileSync } from "node:fs"
import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../helpers/assertions.js"
import { mockActiveStorageUploads } from "../helpers/active_storage_mock.js"

const EXAMPLE_PNG = readFileSync("test/fixtures/files/example.png").toString(
  "base64",
)

test.describe("Paste", () => {
  test("convert to markdown on paste", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("Hello **there**")
    await assertEditorHtml(editor, "<p>Hello <b><strong>there</strong></b></p>")
  })

  test("create links when pasting URLs", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue("<p>Hello everyone</p>")

    await editor.select("everyone")
    await editor.paste("https://37signals.com")

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator('a[href="https://37signals.com"]'),
      ).toHaveText("everyone")
    })
  })

  test("keep content when pasting URLs", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue("<p>Hello everyone</p>")

    await editor.paste("https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Hello everyone<a href="https://37signals.com">https://37signals.com</a></p>',
    )
  })

  test("create links when pasting URLs keeps formatting", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue("<p>Hello everyone</p>")

    await editor.select("everyone")
    await editor.clickToolbarButton("bold")
    await editor.paste("https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Hello <a href="https://37signals.com"><b><strong>everyone</strong></b></a></p>',
    )
  })

  test("merge adjacent links when pasting URL over multiple words", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.send("Hello")
    await editor.flush()
    await editor.select("Hello")
    await editor.paste("https://37signals.com")
    await editor.flush()

    await editor.send("ArrowRight")
    await editor.send(" everyone")
    await editor.flush()

    await editor.selectAll()
    await editor.paste("https://37signals.com")

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator('a[href="https://37signals.com"]'),
      ).toHaveText("Hello everyone")
      await expect(
        content.locator('a[href="https://37signals.com"]'),
      ).toHaveCount(1)
      await expect(content.locator("a + a")).toHaveCount(0)
    })
  })

  test("don't convert markdown when pasting into code block", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("some text")
    await editor.clickToolbarButton("insertCodeBlock")
    await editor.paste("Hello **there**")

    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText("**there**")
      await expect(content.locator("strong")).toHaveCount(0)
    })
  })

  test("don't convert markdown when disabled", async ({ page, editor }) => {
    await page.goto("/markdown-disabled.html")
    await editor.waitForConnected()

    await editor.click()
    await editor.paste("Hello **there**")
    await assertEditorHtml(editor, "<p>Hello **there**</p>")
  })

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
})
