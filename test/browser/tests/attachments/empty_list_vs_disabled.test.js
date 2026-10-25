import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const mentionAttachment = `<div><bc-attachment sgid="test-sgid-alice" content-type="application/vnd.basecamp.mention" content="&lt;bc-mention class=&quot;mentionable-person&quot; gid=&quot;gid://test/Person/1&quot;&gt;&lt;span class=&quot;person--inline&quot;&gt;Alice&lt;/span&gt;&lt;/bc-mention&gt;"></bc-attachment></div>`

test.describe("Empty permitted list vs attachments=false import equivalence (F-21)", () => {
  test("attachments=true with empty permitted-attachment-types strips all attachments on import", async ({ page, editor }) => {
    await page.goto("/attachments-empty-permitted-list.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.setValue(mentionAttachment)
    await editor.flush()

    await expect(editor.content.locator("bc-attachment")).toHaveCount(0)

    const serialized = await editor.value()
    expect(serialized).not.toContain("bc-attachment")
  })

  test("attachments=false strips all attachments on import", async ({ page, editor }) => {
    await page.goto("/attachments-false.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.setValue(mentionAttachment)
    await editor.flush()

    await expect(editor.content.locator("bc-attachment")).toHaveCount(0)

    const serialized = await editor.value()
    expect(serialized).not.toContain("bc-attachment")
  })
})
