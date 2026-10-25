import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const mixedAttachments = [
  `<div><bc-attachment sgid="test-sgid-alice" content-type="application/vnd.basecamp.mention" content="&lt;bc-mention class=&quot;mentionable-person&quot; gid=&quot;gid://test/Person/1&quot;&gt;&lt;span class=&quot;person--inline&quot;&gt;Alice&lt;/span&gt;&lt;/bc-mention&gt;"></bc-attachment></div>`,
  `<div><bc-attachment sgid="test-sgid-og" content-type="application/vnd.basecamp.opengraph-embed" content="&lt;a href=&quot;https://example.com&quot;&gt;Example&lt;/a&gt;"></bc-attachment></div>`,
  `<div><bc-attachment sgid="test-sgid-image" content-type="image/png" content="&lt;img src=&quot;/example.png&quot;&gt;"></bc-attachment></div>`,
].join("")

test.describe("permitted-attachment-types default and sentinel behavior", () => {
  test("unset attribute accepts all content-types on import", async ({ page, editor }) => {
    await page.goto("/attachments-unset-permitted-list.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.setValue(mixedAttachments)
    await editor.flush()

    await expect(
      editor.content.locator("bc-attachment[content-type='application/vnd.basecamp.mention']"),
    ).toHaveCount(1)
    await expect(
      editor.content.locator("bc-attachment[content-type='application/vnd.basecamp.opengraph-embed']"),
    ).toHaveCount(1)
    await expect(
      editor.content.locator("bc-attachment[content-type='image/png']"),
    ).toHaveCount(1)

    const serialized = await editor.value()
    expect(serialized).toContain(`content-type="application/vnd.basecamp.mention"`)
    expect(serialized).toContain(`content-type="application/vnd.basecamp.opengraph-embed"`)
    expect(serialized).toContain(`content-type="image/png"`)
  })

  test('literal "false" sentinel produces empty permitted list, stripping all attachments', async ({ page, editor }) => {
    await page.goto("/attachments-sentinel-false.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.setValue(mixedAttachments)
    await editor.flush()

    await expect(editor.content.locator("bc-attachment")).toHaveCount(0)

    const serialized = await editor.value()
    expect(serialized).not.toContain("bc-attachment")
    expect(serialized).not.toContain("application/vnd.basecamp.mention")
    expect(serialized).not.toContain("application/vnd.basecamp.opengraph-embed")
    expect(serialized).not.toContain("image/png")
  })
})
