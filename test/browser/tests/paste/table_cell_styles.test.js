import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

test.describe("Paste — Table cell color styles", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("strips dark-mode background-color from pasted table cells", async ({
    editor,
  }) => {
    const tableHtml = `
      <table>
        <tr>
          <td style="background-color: rgb(26, 26, 46);">Dark cell</td>
          <td style="background-color: #1a1a2e;">Another dark cell</td>
        </tr>
      </table>
    `

    await editor.paste("Dark cell\tAnother dark cell", { html: tableHtml })

    await assertEditorContent(editor, async (content) => {
      const cells = content.locator("table td")
      await expect(cells).toHaveCount(2)

      for (const cell of await cells.all()) {
        const bgColor = await cell.evaluate(
          (el) => el.style.backgroundColor,
        )
        expect(bgColor).toBe("")
      }
    })
  })

  test("strips light-mode background-color from pasted table cells", async ({
    editor,
  }) => {
    const tableHtml = `
      <table>
        <tr>
          <td style="background-color: rgb(255, 255, 255);">Light cell</td>
          <td style="background-color: white;">White cell</td>
        </tr>
      </table>
    `

    await editor.paste("Light cell\tWhite cell", { html: tableHtml })

    await assertEditorContent(editor, async (content) => {
      const cells = content.locator("table td")
      await expect(cells).toHaveCount(2)

      for (const cell of await cells.all()) {
        const bgColor = await cell.evaluate(
          (el) => el.style.backgroundColor,
        )
        expect(bgColor).toBe("")
      }
    })
  })

  test("strips color from pasted table cell text nodes", async ({
    editor,
  }) => {
    const tableHtml = `
      <table>
        <tr>
          <td style="background-color: #1a1a2e; color: #eeeeee;">Styled text</td>
        </tr>
      </table>
    `

    await editor.paste("Styled text", { html: tableHtml })

    await assertEditorContent(editor, async (content) => {
      const cell = content.locator("table td")
      await expect(cell).toHaveCount(1)

      const bgColor = await cell.evaluate((el) => el.style.backgroundColor)
      expect(bgColor).toBe("")

      const color = await cell.evaluate((el) => el.style.color)
      expect(color).toBe("")
    })
  })

  test("strips background shorthand from pasted table header cells", async ({
    editor,
  }) => {
    const tableHtml = `
      <table>
        <tr>
          <th style="background: rgb(40, 40, 60);">Header</th>
          <td style="background: rgb(26, 26, 46);">Data</td>
        </tr>
      </table>
    `

    await editor.paste("Header\tData", { html: tableHtml })

    await assertEditorContent(editor, async (content) => {
      const cells = content.locator("table td, table th")
      await expect(cells).toHaveCount(2)

      for (const cell of await cells.all()) {
        const bg = await cell.evaluate(
          (el) => el.style.background,
        )
        expect(bg).toBe("")
      }
    })
  })
})
