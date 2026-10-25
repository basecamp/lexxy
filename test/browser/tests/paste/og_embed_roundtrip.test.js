import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const ogEmbedAttachment = `<p><bc-attachment sgid="test-sgid-og" content-type="application/vnd.basecamp.opengraph-embed" content="&lt;a href=&quot;https://example.com&quot;&gt;Example&lt;/a&gt;"></bc-attachment></p>`

test.describe("OG embed round-trip through setValue", () => {
  test("permitting editor preserves OG attachment across setValue round-trip", async ({ page, editor }) => {
    await page.goto("/attachments-permitted-og-embed.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.setValue(ogEmbedAttachment)
    await editor.flush()

    await expect(
      editor.content.locator("bc-attachment[content-type='application/vnd.basecamp.opengraph-embed']"),
    ).toHaveCount(1)

    const firstSerialized = await editor.value()
    expect(firstSerialized).toContain(`content-type="application/vnd.basecamp.opengraph-embed"`)
    expect(firstSerialized).toContain(`sgid="test-sgid-og"`)

    await editor.setValue(firstSerialized)
    await editor.flush()

    await expect(
      editor.content.locator("bc-attachment[content-type='application/vnd.basecamp.opengraph-embed']"),
    ).toHaveCount(1)

    const secondSerialized = await editor.value()
    expect(secondSerialized).toBe(firstSerialized)
  })

  test("non-permitting editor strips OG attachment on import", async ({ page, editor }) => {
    await page.goto("/mentions-custom-element.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.setValue(ogEmbedAttachment)
    await editor.flush()

    await expect(editor.content.locator("bc-attachment")).toHaveCount(0)

    const serialized = await editor.value()
    expect(serialized).not.toContain("application/vnd.basecamp.opengraph-embed")
    expect(serialized).not.toContain("bc-attachment")
  })
})
