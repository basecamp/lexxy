import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const mention = `<bc-attachment sgid="test-sgid-alice" content-type="application/vnd.basecamp.mention" content="&lt;bc-mention class=&quot;mentionable-person&quot; gid=&quot;gid://test/Person/1&quot;&gt;&lt;span class=&quot;person--inline&quot;&gt;Alice&lt;/span&gt;&lt;/bc-mention&gt;"></bc-attachment>`

test.describe("Whitespace around custom attachments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("preserves the space between a bold run and a following attachment", async ({ editor }) => {
    await editor.setValue(`<p><strong>Link: </strong>${mention}<strong>.</strong></p>`)
    await editor.flush()

    expect(await editor.value()).toContain("<strong>Link:</strong> <bc-attachment")
  })

  test("preserves the space between an attachment and a following bold run", async ({ editor }) => {
    await editor.setValue(`<p>${mention}<strong> end</strong></p>`)
    await editor.flush()

    expect(await editor.value()).toContain("</bc-attachment> <strong>end</strong>")
  })

  test("keeps non-breaking spaces inside a format intact without adding a space", async ({ editor }) => {
    await editor.setValue(`<p><strong>Link:&nbsp;&nbsp;</strong>${mention}</p>`)
    await editor.flush()

    expect(await editor.value()).toContain("<strong>Link:&nbsp;&nbsp;</strong><bc-attachment")
  })
})
