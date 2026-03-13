import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../helpers/assertions.js"

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
