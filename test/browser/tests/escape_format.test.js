import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../helpers/assertions.js"

test.describe("Escape format", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("escape from blockquote with list at end", async ({ page, editor }) => {
    await editor.send("First line")
    await editor.selectAll()

    await page.getByRole("button", { name: "Bullet list" }).click()
    await assertEditorHtml(editor, "<ul><li>First line</li></ul>")

    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(
      editor,
      "<blockquote><ul><li>First line</li></ul></blockquote>",
    )

    await editor.send("ArrowRight")
    await editor.send("Enter", "Enter", "Enter")

    await editor.send("Outside quote")

    await assertEditorHtml(
      editor,
      "<blockquote><ul><li>First line</li></ul></blockquote><p>Outside quote</p>",
    )
  })

  test("split blockquote when escaping from middle", async ({
    page,
    editor,
  }) => {
    await editor.send("First paragraph")
    await editor.send("Enter")
    await editor.send("Second paragraph")
    await editor.send("Enter")
    await editor.send("Third paragraph")
    await editor.selectAll()
    await page.getByRole("button", { name: "Quote" }).click()

    await editor.select("Second paragraph")
    await editor.send("ArrowRight")

    await editor.send("Enter", "Enter")

    await editor.send("Middle content")

    await assertEditorHtml(
      editor,
      "<blockquote><p>First paragraph</p><p>Second paragraph</p></blockquote><p>Middle content</p><blockquote><p>Third paragraph</p></blockquote>",
    )
  })

  test("split blockquote when escaping from middle of list", async ({
    page,
    editor,
  }) => {
    await editor.send("Item one")
    await editor.send("Enter")
    await editor.send("Item two")
    await editor.send("Enter")
    await editor.send("Item three")
    await editor.selectAll()
    await page.getByRole("button", { name: "Bullet list" }).click()

    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(
      editor,
      "<blockquote><ul><li>Item one</li><li>Item two</li><li>Item three</li></ul></blockquote>",
    )

    await editor.select("Item two")
    await editor.send("ArrowRight")

    await editor.send("Enter", "Enter")

    await editor.send("Middle text")

    await assertEditorHtml(
      editor,
      "<blockquote><ul><li>Item one</li><li>Item two</li></ul></blockquote><p>Middle text</p><blockquote><ul><li>Item three</li></ul></blockquote>",
    )
  })

  test("escape without splitting when all nodes after are empty", async ({
    page,
    editor,
  }) => {
    await editor.send("Item one")
    await editor.selectAll()
    await page.getByRole("button", { name: "Bullet list" }).click()

    await page.getByRole("button", { name: "Quote" }).click()
    await assertEditorHtml(
      editor,
      "<blockquote><ul><li>Item one</li></ul></blockquote>",
    )

    await editor.send("ArrowRight")
    await editor.send("Enter", "Enter", "Enter")

    await editor.send("After escape")

    await assertEditorHtml(
      editor,
      "<blockquote><ul><li>Item one</li></ul></blockquote><p>After escape</p>",
    )
  })

  test("exit code block by pressing Enter on empty last line", async ({ page, editor }) => {
    await editor.setValue("<pre><code>line one</code></pre>")
    await editor.click()

    await editor.send("End")
    await editor.send("Enter")
    await editor.send("Enter")

    await editor.send("outside text")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toContainText("line one")
      await expect(content.locator("p")).toContainText("outside text")
    })
  })

  test("exit code block with ArrowDown when code block is last element", async ({ page, editor }) => {
    await editor.setValue("<pre><code>some code</code></pre>")
    await editor.click()

    await editor.send("End")
    await editor.send("ArrowDown")

    await editor.send("after code")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toContainText("some code")
      await expect(content.locator("p")).toContainText("after code")
    })
  })
})
