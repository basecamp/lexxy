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

  test("ignores comments next to an attachment", async ({ editor }) => {
    await editor.setValue(`<p>Hi<!-- note -->${mention}<!-- note -->there</p>`)
    await editor.flush()

    expect(await editor.value()).toMatch(/<p>Hi<bc-attachment [^>]*><\/bc-attachment>there<\/p>/)
  })

  test("keeps a single space between adjacent attachments", async ({ editor }) => {
    await editor.setValue(`<p>${mention} ${mention}</p>`)
    await editor.flush()

    expect(await editor.value()).toContain("</bc-attachment> <bc-attachment")
  })

  test("keeps a single space between adjacent attachments when one is wrapped in a format", async ({ editor }) => {
    await editor.setValue(`<p><strong>${mention} </strong>${mention}</p>`)
    await editor.flush()

    expect(await editor.value()).toMatch(/<\/bc-attachment><strong> <\/strong><bc-attachment/)
  })

  test("does not add a space across a line break", async ({ editor }) => {
    await editor.setValue(`<p><strong>Hello <br></strong>${mention}<strong><br> there</strong></p>`)
    await editor.flush()

    expect(await editor.value()).toMatch(/<br><bc-attachment [^>]*><\/bc-attachment><br>/)
  })

  test("ignores the label of an adjacent attachment", async ({ editor }) => {
    await editor.setValue(`<p>${mention.replace("></bc-attachment>", ">Alice </bc-attachment>")}${mention.replace("></bc-attachment>", "> Bob</bc-attachment>")}</p>`)
    await editor.flush()

    expect(await editor.value()).toMatch(/<\/bc-attachment><bc-attachment/)
  })

  test("restores the space when the attachment is wrapped in a format", async ({ editor }) => {
    await editor.setValue(`<p>Hello <em>${mention}</em> there</p>`)
    await editor.flush()

    expect(await editor.value()).toMatch(/^<p>Hello <bc-attachment [^>]*><\/bc-attachment><em> <\/em>there<\/p>$/)
  })

  test("keeps a single space between attachments when it is split across formats", async ({ editor }) => {
    await editor.setValue(`<p>${mention}<strong> </strong><em> </em>${mention}</p>`)
    await editor.flush()

    expect(await editor.value()).toMatch(/<\/bc-attachment>(<strong> <\/strong>| )<bc-attachment/)
  })

  test("ignores whitespace between paragraphs", async ({ editor }) => {
    await editor.setValue(`<p>before</p>\n<p>${mention}</p>\n<p>after</p>`)
    await editor.flush()

    expect(await editor.value()).toMatch(/<p><bc-attachment [^>]*><\/bc-attachment><\/p>/)
  })

  test("does not add a space next to an adjacent wrapped attachment", async ({ editor }) => {
    await editor.setValue(`<p>Hi <strong>${mention}</strong>${mention}<em>${mention}</em> there</p>`)
    await editor.flush()

    expect(await editor.value()).toMatch(/^<p>Hi (<bc-attachment [^>]*><\/bc-attachment>){3}<em> <\/em>there<\/p>$/)
  })

  test("keeps the space after a wrapped attachment that follows text", async ({ editor }) => {
    await editor.setValue(`<p><mark>Hi${mention}</mark> ${mention}</p>`)
    await editor.flush()

    expect(await editor.value()).toMatch(/<\/bc-attachment> <bc-attachment/)
  })
})
