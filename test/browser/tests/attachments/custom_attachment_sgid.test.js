import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const mention = `<bc-attachment sgid="test-sgid-alice" content-type="application/vnd.basecamp.mention" content="&lt;bc-mention class=&quot;mentionable-person&quot; gid=&quot;gid://test/Person/1&quot;&gt;&lt;span class=&quot;person--inline&quot;&gt;Alice&lt;/span&gt;&lt;/bc-mention&gt;"></bc-attachment>`

test.describe("Custom attachment sgid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("renders the attachment's sgid in the editor, as Action Text does when rendering content", async ({ page, editor }) => {
    await editor.setValue(`<p>Hi ${mention}</p>`)
    await editor.flush()

    await expect(page.locator(".lexxy-editor__content bc-attachment")).toHaveAttribute("sgid", "test-sgid-alice")
    expect(await editor.value()).toContain(`<bc-attachment sgid="test-sgid-alice"`)
  })
})
