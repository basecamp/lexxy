import { test } from "../test_helper.js"
import { expect } from "@playwright/test"

const mentionHtml = (name) =>
  `<action-text-attachment content-type="application/vnd.actiontext.mention" content="<span>${name}</span>"></action-text-attachment>`

test.describe("Inline decorator deletion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("typing with a selected mention replaces it at the correct position", async ({ page, editor }) => {
    await editor.setValue(
      `<p>Before ${mentionHtml("Alice")} after</p>`,
    )
    await editor.flush()

    const mention = editor.content.locator("action-text-attachment")
    await expect(mention).toHaveCount(1)

    // Click to select the mention
    await mention.click()
    await editor.flush()
    await expect(mention).toHaveClass(/node--selected/)

    // Type to replace the mention
    await editor.send("X")
    await editor.flush()

    // Mention should be gone and X should be at the correct position
    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)

    const text = await editor.plainTextValue()
    expect(text).toMatch(/Before\s*X\s*after/)
  })

  test("typing with a selected mention between two mentions replaces only the selected one", async ({ page, editor }) => {
    await editor.setValue(
      `<p>AAA ${mentionHtml("Alice")} BBB ${mentionHtml("Bob")} CCC</p>`,
    )
    await editor.flush()

    const mentions = editor.content.locator("action-text-attachment")
    await expect(mentions).toHaveCount(2)

    // Select Alice
    await mentions.first().click()
    await editor.flush()
    await expect(mentions.first()).toHaveClass(/node--selected/)

    // Type to replace
    await editor.send("X")
    await editor.flush()

    // Only Bob should remain
    await expect(editor.content.locator("action-text-attachment")).toHaveCount(1)

    const text = await editor.plainTextValue()
    expect(text).toMatch(/AAA\s*X\s*BBB/)
    expect(text).toContain("Bob")
    expect(text).toContain("CCC")
  })

  test("pressing Delete on a selected inline decorator removes it and positions cursor correctly", async ({ page, editor }) => {
    await editor.setValue(
      `<p>Before ${mentionHtml("Alice")} after</p>`,
    )
    await editor.flush()

    const mention = editor.content.locator("action-text-attachment")
    await expect(mention).toHaveCount(1)

    await mention.click()
    await editor.flush()
    await expect(mention).toHaveClass(/node--selected/)

    await page.keyboard.press("Delete")
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)

    // Type to verify position
    await editor.send("X")
    await editor.flush()

    const text = await editor.plainTextValue()
    expect(text).toMatch(/Before\s*X\s*after/)
  })

  test("pressing Backspace on a selected inline decorator removes it and positions cursor correctly", async ({ page, editor }) => {
    await editor.setValue(
      `<p>Before ${mentionHtml("Alice")} after</p>`,
    )
    await editor.flush()

    const mention = editor.content.locator("action-text-attachment")
    await expect(mention).toHaveCount(1)

    await mention.click()
    await editor.flush()
    await expect(mention).toHaveClass(/node--selected/)

    await page.keyboard.press("Backspace")
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(0)

    // Type to verify position
    await editor.send("X")
    await editor.flush()

    const text = await editor.plainTextValue()
    expect(text).toMatch(/Before\s*X\s*after/)
  })
})
