import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Code block toolbar button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  // Regression tests for a crash where clicking the Code toolbar button threw
  // "Point.getNode: node not found" (Lexical error 20) and left the editor
  // unresponsive. The root cause was unguarded selection.anchor.getNode() calls
  // in toggleCodeBlock(), getFormat(), and #updateButtonStates() that threw when
  // the selection referenced a node removed during tree transforms.

  test("code block with collapsed cursor converts paragraph and stays responsive", async ({ page, editor }) => {
    await editor.click()
    await editor.send("Hello world")
    await editor.flush()

    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    // Verify the editor is still responsive by typing more text
    await editor.send("Enter")
    await editor.send("More text")
    await editor.flush()

    const html = await editor.value()
    expect(html).toContain("Hello world")
    expect(html).toContain("More text")
  })

  test("inline code on selected single-line text", async ({ page, editor }) => {
    await editor.click()
    await editor.send("Hello world")
    await editor.flush()

    await editor.select("Hello world")
    await editor.flush()

    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    await assertEditorHtml(editor, "<p><code>Hello world</code></p>")
  })

  test("code block on multi-line selection stays responsive", async ({ page, editor }) => {
    await editor.click()
    await editor.send("Line one")
    await editor.send("Enter")
    await editor.send("Line two")
    await editor.flush()

    await editor.selectAll()
    await editor.flush()

    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    // The editor should remain functional after applying code block
    await editor.send("Enter")
    await editor.send("After code")
    await editor.flush()

    const html = await editor.value()
    expect(html).toContain("After code")
  })

  test("code block toggle on and off preserves editor responsiveness", async ({ page, editor }) => {
    await editor.click()
    await editor.send("Some code")
    await editor.flush()

    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    await editor.send(" and more")
    await editor.flush()

    const html = await editor.value()
    expect(html).toContain("Some code")
    expect(html).toContain("and more")
  })

  test("code block on empty editor", async ({ page, editor }) => {
    await editor.click()
    await editor.flush()

    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    await editor.send("function hello() {}")
    await editor.flush()

    const html = await editor.value()
    expect(html).toContain("function hello()")
  })
})
