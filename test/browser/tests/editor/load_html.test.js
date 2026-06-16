import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import {
  assertEditorHtml,
  assertEditorContent,
} from "../../helpers/assertions.js"

test.describe("Load HTML", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("load simple string", async ({ editor }) => {
    await editor.setValue("Hello")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("p")).toHaveText("Hello")
    })
  })

  test("normalize loaded HTML", async ({ editor }) => {
    await editor.setValue("<div>hello</div> <div>there</div>")
    await assertEditorHtml(editor, "<p>hello</p><p>there</p>")
  })

  test("load HTML with newlines between div elements does not crash", async ({ editor }) => {
    // Whitespace text nodes (\n) between block elements like <div> are common in email HTML.
    // Previously this threw Lexical error #282 because the \n became a TextNode at the root level.
    await editor.setValue("<div>First paragraph.</div>\n<div><br></div>\n<div>Second paragraph.</div>")

    await assertEditorContent(editor, async (content) => {
      const paragraphs = content.locator("p")
      await expect(paragraphs.first()).toHaveText("First paragraph.")
      await expect(paragraphs.last()).toHaveText("Second paragraph.")
    })
  })

  test("preserves blank-line paragraphs between Trix div blocks", async ({ editor }) => {
    await editor.setValue("<div>First paragraph.</div><div><br></div><div>Second paragraph.</div>")
    await assertEditorHtml(editor, "<p>First paragraph.</p><p><br></p><p>Second paragraph.</p>")
  })

  test("preserves multiple consecutive blank-line paragraphs", async ({ editor }) => {
    await editor.setValue("<div>First.</div><div><br></div><div><br></div><div>Last.</div>")
    await assertEditorHtml(editor, "<p>First.</p><p><br></p><p><br></p><p>Last.</p>")
  })

  test("keeps blank-line paragraphs stable across a serialize round-trip", async ({ editor }) => {
    // Mirrors the edit → save → re-edit cycle: the editor's own serialized output must reload
    // without the blank line being stripped again.
    await editor.setValue("<div>First paragraph.</div><div><br></div><div>Second paragraph.</div>")
    const serialized = await editor.value()
    await editor.setValue(serialized)
    await assertEditorHtml(editor, "<p>First paragraph.</p><p><br></p><p>Second paragraph.</p>")
  })

  test("preserves inline image data URIs untouched (no paste-time conversion)", async ({ editor }) => {
    const dataURI = `data:image/png;base64,${Buffer.from("\x89PNG\r\n\x1a\n", "binary").toString("base64")}`
    await editor.setValue(`<p>before</p><img src="${dataURI}"><p>after</p>`)

    expect(await editor.value()).toContain(dataURI)
  })
})
