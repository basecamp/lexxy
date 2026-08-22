import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"
import { clickToolbarButton } from "../../helpers/toolbar.js"

const CODE_BLOCK_HTML = '<pre data-language="plain"><code>alpha beta</code></pre><p>After</p>'
const INLINE_CODE_HTML = "<p>Hello <code>world</code> again</p>"

test.describe("Code blocks disabled, inline code enabled", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/code-blocks-false.html")
    await editor.waitForConnected()
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("the shared code toolbar button is still visible", async ({ page }) => {
    await expect(page.locator("lexxy-toolbar button[name='code']")).toBeVisible()
  })

  test("the toolbar button applies inline code instead of a code block", async ({ page, editor }) => {
    await editor.setValue("<p>hello</p>")
    await editor.select("hello")

    await clickToolbarButton(page, "insertCodeBlock")

    await assertEditorHtml(editor, "<p><code>hello</code></p>")
    await expect(editor.content.locator("pre")).toHaveCount(0)
  })

  test("typing a Markdown fence does not create a code block", async ({ editor }) => {
    await editor.click()
    await editor.send("```")
    await editor.send("Enter")
    await editor.flush()

    await expect(editor.content.locator("pre")).toHaveCount(0)
  })

  test("a loaded code block is reduced to plain text", async ({ editor }) => {
    await editor.setValue(CODE_BLOCK_HTML)

    await expect(editor.content.locator("code")).toHaveCount(0)
    const value = await editor.value()
    expect(value).not.toContain("<pre")
    expect(value).toContain("alpha beta")
    expect(value).toContain("After")
  })
})

test.describe("Inline code disabled, code blocks enabled", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/inline-code-false.html")
    await editor.waitForConnected()
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("the shared code toolbar button is still visible", async ({ page }) => {
    await expect(page.locator("lexxy-toolbar button[name='code']")).toBeVisible()
  })

  test("the toolbar button inserts a code block instead of inline code", async ({ page, editor }) => {
    await editor.setValue("<p>hello</p>")
    await editor.select("hello")

    await clickToolbarButton(page, "insertCodeBlock")

    await expect.poll(() => editor.value()).toContain("<pre")
    expect(await editor.value()).not.toContain("<code")
  })

  test("typing a Markdown backtick does not apply inline code", async ({ editor }) => {
    await editor.click()
    await editor.send("`hello`")
    await editor.flush()

    await expect(editor.content.locator("code")).toHaveCount(0)
    expect(await editor.plainTextValue()).toContain("hello")
  })

  test("loaded inline code is reduced to plain text", async ({ editor }) => {
    await editor.setValue(INLINE_CODE_HTML)

    await expect(editor.content.locator("code")).toHaveCount(0)
    const value = await editor.value()
    expect(value).not.toContain("<code")
    expect(value).toContain("Hello")
    expect(value).toContain("world")
    expect(value).toContain("again")
  })
})

test.describe("Code blocks and inline code both disabled", () => {
  test("the shared code toolbar button is hidden", async ({ page, editor }) => {
    await page.goto("/code-all-false.html")
    await editor.waitForConnected()
    await page.waitForSelector("lexxy-toolbar[connected]")

    await expect(page.locator("lexxy-toolbar button[name='code']")).toBeHidden()
  })

  test("the editor connects without console errors", async ({ page, editor }) => {
    startMonitoringConsole(page)

    await page.goto("/code-all-false.html")
    await editor.waitForConnected()

    expect(page).toHaveNoErrors()
  })
})
