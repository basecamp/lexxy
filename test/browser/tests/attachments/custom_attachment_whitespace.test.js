import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const mention = `<bc-attachment sgid="test-sgid-alice" content-type="application/vnd.basecamp.mention" content="&lt;bc-mention class=&quot;mentionable-person&quot; gid=&quot;gid://test/Person/1&quot;&gt;&lt;span class=&quot;person--inline&quot;&gt;Alice&lt;/span&gt;&lt;/bc-mention&gt;"></bc-attachment>`

const NBSP = "\u00a0"

test.describe("Whitespace around custom attachments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("preserves the space between a bold run and a following attachment", async ({ editor }) => {
    await editor.setValue(`<p><strong>Link: </strong>${mention}<strong>.</strong></p>`)
    await editor.flush()

    expect(await editor.plainTextValue()).toBe("Link: Alice.")
  })

  test("preserves the space between an attachment and a following bold run", async ({ editor }) => {
    await editor.setValue(`<p>${mention}<strong> end</strong></p>`)
    await editor.flush()

    expect(await editor.plainTextValue()).toBe("Alice end")
  })

  test("keeps non-breaking spaces inside a format intact without adding a space", async ({ editor }) => {
    await editor.setValue(`<p><strong>Link:&nbsp;&nbsp;</strong>${mention}</p>`)
    await editor.flush()

    expect(await editor.plainTextValue()).toBe(`Link:${NBSP}${NBSP}Alice`)
  })
})
