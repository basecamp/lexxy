import { test } from "../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Bug #3803: Click below a table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("clicking below a table places cursor after the table", async ({
    page,
    editor,
  }) => {
    // Load content with a table as the only element (no trailing paragraph)
    const tableHtml = `<figure class="lexxy-content__table-wrapper"><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></figure>`
    await editor.setValue(tableHtml)
    await editor.flush()

    await expect(editor.content.locator("table")).toHaveCount(1)

    // Get bounding boxes to click below the table
    const tableBox = await editor.content.locator("table").boundingBox()
    const contentBox = await editor.content.boundingBox()

    const clickX = contentBox.x + contentBox.width / 2
    const clickY = Math.min(
      tableBox.y + tableBox.height + 20,
      contentBox.y + contentBox.height - 5,
    )

    await page.mouse.click(clickX, clickY)
    await editor.flush()

    // Type to verify cursor is outside the table
    await page.keyboard.type("Below table")
    await editor.flush()

    // Text should NOT appear inside the table
    const tableText = await editor.content.locator("table").textContent()
    expect(tableText).not.toContain("Below table")

    // Text should be in a paragraph after the table
    const matchingParagraph = editor.content.locator("p").filter({
      hasText: "Below table",
    })
    await expect(matchingParagraph).toHaveCount(1)
  })
})
