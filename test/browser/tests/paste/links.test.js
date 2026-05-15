import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../../helpers/assertions.js"

test.describe("Paste — Links", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("create links when pasting URLs", async ({ page, editor }) => {
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
    await editor.setValue("<p>Hello everyone</p>")

    await editor.paste("https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Hello everyone<a href="https://37signals.com">https://37signals.com</a></p>',
    )
  })

  test("creates a link when pasting a solo text/uri-list payload (App ShareSheet)", async ({ page, editor }) => {
    await editor.setValue("<p>Hello everyone</p>")

    await editor.paste(null, { uriList: "https://37signals.com" })

    await assertEditorHtml(
      editor,
      '<p>Hello everyone<a href="https://37signals.com">https://37signals.com</a></p>',
    )
  })

  test("creates a link when pasting text/uri-list with a text/plain companion (Safari)", async ({ page, editor }) => {
    await editor.setValue("<p>Hello everyone</p>")

    await editor.paste("https://37signals.com", { uriList: "https://37signals.com" })

    await assertEditorHtml(
      editor,
      '<p>Hello everyone<a href="https://37signals.com">https://37signals.com</a></p>',
    )
  })

  test("create links when pasting URLs keeps formatting", async ({
    page,
    editor,
  }) => {
    await editor.setValue("<p>Hello everyone</p>")

    await editor.select("everyone")
    await editor.clickToolbarButton("bold")
    await editor.paste("https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Hello <a href="https://37signals.com"><strong>everyone</strong></a></p>',
    )
  })

  const thingsThatMightBeURIs = [
    [ "https://example.com/", true ],
    [ "http://example.com/", true ],
    [ "https://user:pass@example.com/", true ],
    [ "www.example.com", true, "https://www.example.com" ],
    [ "HTTPS://example.com/", true ],
    [ "Http://example.com/", true ],
    [ "WWW.example.com", true, "https://WWW.example.com" ],
    [ "example.com", false ],

    [ "http::parser", false ],
    [ "https::client", false ],
    [ "mailto::linker", false ],
    [ "ftp::client", false ],

    [ "Nokogiri::HTML", false ],
    [ "Net::HTTP", false ],
    [ "Foo::Bar::Baz", false ],

    [ "port:8080", false ],
    [ "key:value", false ],
    [ "time:9:00", false ],
  ]

  for (const [ text, shouldLink, expectedHref = text ] of thingsThatMightBeURIs) {
    test(`'${text}' ${shouldLink ? "is" : "is not"} auto-linked when pasted as plain text`, async ({ editor }) => {
      await editor.paste(text)

      await assertEditorContent(editor, async (content) => {
        if (shouldLink) {
          await expect(content.locator(`a[href="${expectedHref}"]`)).toHaveText(text)
        } else {
          await expect(content).toContainText(text)
          await expect(content.locator("a")).toHaveCount(0)
        }
      })
    })
  }

  test("merge adjacent links when pasting URL over multiple words", async ({
    page,
    editor,
  }) => {
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
})

test.describe("Paste: rendered content with placeholder anchors", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("preserves link URLs when pasting HTML with anchors", async ({
    editor,
  }) => {
    const html =
      '<p>Check out <a href="https://example.com/page">this page</a> for details</p>'

    await editor.paste("Check out this page for details", { html })

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator('a[href="https://example.com/page"]'),
      ).toHaveText("this page")
    })
  })

  test("converts fragment-only anchors to plain text", async ({ editor }) => {
    const html = '<p>Hey <a href="#">@Jorge</a>, check this out</p>'

    await editor.paste("Hey @Jorge, check this out", { html })

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("a")).toHaveCount(0)
      await expect(content).toContainText("Hey @Jorge, check this out")
    })
  })

  test("preserves real links but strips fragment-only anchors in mixed content", async ({
    editor,
  }) => {
    const html = [
      "<p>Hey <a href=\"#\">@Jorge</a>, check out ",
      '<a href="https://example.com">this link</a>',
      " when you get a chance</p>",
    ].join("")

    await editor.paste(
      "Hey @Jorge, check out this link when you get a chance",
      { html },
    )

    await assertEditorContent(editor, async (content) => {
      await expect(
        content.locator('a[href="https://example.com"]'),
      ).toHaveText("this link")
      await expect(content.locator('a[href="#"]')).toHaveCount(0)
      await expect(content).toContainText("@Jorge")
    })
  })

  test("strips empty-href anchors from pasted content", async ({ editor }) => {
    const html = '<p>Hello <a href="">world</a></p>'

    await editor.paste("Hello world", { html })

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("a")).toHaveCount(0)
      await expect(content).toContainText("Hello world")
    })
  })
})
