import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const MENTION = '<action-text-attachment sgid="test-sgid-zacharias" content-type="application/vnd.actiontext.mention" content="&lt;span class=&quot;person person--inline&quot;&gt;Zacharias&lt;/span&gt;"></action-text-attachment>'

async function dragAcrossParagraph(page, editor) {
  const paragraph = await editor.content.locator("p").first().boundingBox()
  const y = paragraph.y + paragraph.height / 2

  await page.mouse.move(paragraph.x + 4, y)
  await page.mouse.down()
  await page.mouse.move(paragraph.x + paragraph.width - 4, y, { steps: 15 })
  await page.mouse.up()
  await editor.flush()
}

function selectedText(page) {
  return page.evaluate(() => window.getSelection().toString())
}

test.describe("Selecting content that contains a mention", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("dragging across a mention selects the surrounding text", async ({ page, editor }) => {
    await editor.setValue(`<p>Hello ${MENTION} world</p>`)
    await editor.flush()

    await dragAcrossParagraph(page, editor)

    const selection = await selectedText(page)
    expect(selection).toContain("Hello")
    expect(selection).toContain("world")
    expect(selection).toContain("Zacharias")
  })

  test("dragging across plain text still selects it", async ({ page, editor }) => {
    await editor.setValue("<p>Hello there world</p>")
    await editor.flush()

    await dragAcrossParagraph(page, editor)

    expect(await selectedText(page)).toContain("Hello there world")
  })
})
