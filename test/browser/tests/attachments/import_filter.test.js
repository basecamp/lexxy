import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const imageAttachment = `<div><bc-attachment sgid="test-sgid-image" content-type="image/png" content="&lt;img src=&quot;/example.png&quot;&gt;"></bc-attachment></div>`

const mentionAttachment = `<div><bc-attachment sgid="test-sgid-alice" content-type="application/vnd.basecamp.mention" content="&lt;bc-mention class=&quot;mentionable-person&quot; gid=&quot;gid://test/Person/1&quot;&gt;&lt;span class=&quot;person--inline&quot;&gt;Alice&lt;/span&gt;&lt;/bc-mention&gt;"></bc-attachment></div>`

const imageAttachmentInTable = `<figure class="lexxy-content__table-wrapper"><table><thead><tr><th>Header</th></tr></thead><tbody><tr><td><bc-attachment sgid="test-sgid-image" content-type="image/png" content="&lt;img src=&quot;/example.png&quot;&gt;"></bc-attachment></td></tr></tbody></table></figure>`

const attachmentWithoutContentType = `<div><bc-attachment sgid="test-sgid-untyped" content="&lt;img src=&quot;/example.png&quot;&gt;"></bc-attachment></div>`

test.describe("Attachment import filter honors data-permitted-attachment-types", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("disallowed attachment content-type is stripped on import", async ({ page, editor }) => {
    await editor.setValue(imageAttachment)
    await editor.flush()

    await expect(editor.content.locator("bc-attachment[content-type='image/png']")).toHaveCount(0)
    await expect(editor.content.locator("bc-attachment")).toHaveCount(0)
    await expect(editor.content.locator("img")).toHaveCount(0)

    const serialized = await editor.value()
    expect(serialized).not.toContain(`content-type="image/png"`)
    expect(serialized).not.toContain("bc-attachment")
    expect(serialized).not.toContain("<img")
  })

  test("permitted attachment content-type survives import", async ({ page, editor }) => {
    await editor.setValue(mentionAttachment)
    await editor.flush()

    await expect(
      editor.content.locator("bc-attachment[content-type='application/vnd.basecamp.mention']"),
    ).toHaveCount(1)
  })

  test("disallowed attachment nested in a table cell is stripped, table survives", async ({ page, editor }) => {
    await editor.setValue(imageAttachmentInTable)
    await editor.flush()

    await expect(editor.content.locator("table")).toHaveCount(1)
    await expect(editor.content.locator("bc-attachment")).toHaveCount(0)
    await expect(editor.content.locator("bc-attachment[content-type='image/png']")).toHaveCount(0)
    await expect(editor.content.locator("td img")).toHaveCount(0)

    const serialized = await editor.value()
    expect(serialized).toContain("<table")
    expect(serialized).not.toContain("bc-attachment")
    expect(serialized).not.toContain(`content-type="image/png"`)
    expect(serialized).not.toContain("<img")
  })

  test("bc-attachment without content-type attribute is stripped on strict allowlist", async ({ page, editor }) => {
    await editor.setValue(attachmentWithoutContentType)
    await editor.flush()

    await expect(editor.content.locator("bc-attachment")).toHaveCount(0)

    const serialized = await editor.value()
    expect(serialized).not.toContain("bc-attachment")
  })

  test("insert-editable-text prompt template with nested <img> does not produce an attachment node", async ({ page, editor }) => {
    await editor.send("#")

    const popover = page.locator(".lexxy-prompt-menu--visible")
    await expect(popover).toBeVisible({ timeout: 5_000 })

    await editor.send("Enter")
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)
    await expect(editor.content.locator("bc-attachment")).toHaveCount(0)

    const serialized = await editor.value()
    expect(serialized).not.toContain("action-text-attachment")
    expect(serialized).not.toContain("bc-attachment")
    expect(serialized).not.toContain("<img")
    expect(serialized).toContain("Jane")
    expect(serialized).toContain('href="/people/jane"')
  })
})
