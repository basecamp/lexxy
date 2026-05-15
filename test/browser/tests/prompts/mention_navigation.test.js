import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const mentionHtml = [
  "<action-text-attachment",
  ' content-type="application/vnd.actiontext.mention"',
  ' sgid="test-sgid-123"',
  ' content="&lt;span class=&quot;person&quot;&gt;Alice&lt;/span&gt;"',
  ">Alice</action-text-attachment>"
].join("")

test.describe("Mention navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("ArrowRight from the end of the text before a mention selects it", async ({ editor }) => {
    await editor.setValue(`<p>X${mentionHtml}Y</p>`)
    await editor.flush()

    await editor.content.click()
    await editor.send("Home")
    await editor.send("ArrowRight")
    await editor.send("ArrowRight")
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment.node--selected")).toHaveCount(1)
  })

  test("ArrowLeft from the start of the text after a mention selects it", async ({ editor }) => {
    await editor.setValue(`<p>X${mentionHtml}Y</p>`)
    await editor.flush()

    await editor.content.click()
    await editor.send("End")
    await editor.send("ArrowLeft")
    await editor.send("ArrowLeft")
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment.node--selected")).toHaveCount(1)
  })

  test("typing while a mention is selected drops the selection and inserts before it", async ({ editor }) => {
    await editor.setValue(`<p>Hi ${mentionHtml}!</p>`)
    await editor.flush()

    await editor.content.locator("action-text-attachment").click()
    await expect(editor.content.locator("action-text-attachment.node--selected")).toHaveCount(1)

    await editor.send("Z")
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(1)
    expect(await editor.value()).toContain("Hi Z<action-text-attachment")
  })
})
