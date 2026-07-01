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

  // Excel puts hardcoded text colors on the inner spans/fonts of each cell, not
  // just on the <td>. A Lexxy table adopts the current theme, so pasted foreign
  // colors inside cells must be stripped along with the cell's own styles.
  test("strips color from elements nested inside pasted table cells", async ({
    editor,
  }) => {
    const tableHtml = `
      <table>
        <tr>
          <td style="color: windowtext;"><span style="color: black;">First</span></td>
          <td><font color="#000000"><span style="color: #000000;">Second</span></font></td>
        </tr>
      </table>
    `

    await editor.paste("First\tSecond", { html: tableHtml })

    await assertEditorContent(editor, async (content) => {
      const styledDescendants = content.locator(
        'table td [style*="color"], table th [style*="color"]',
      )
      await expect(styledDescendants).toHaveCount(0)
    })
  })

  // A cell shaded in Excel keeps a hardcoded background-color that survives the
  // sanitizer. Cell shading can't be set in Lexxy, so strip it on paste.
  test("strips shading and text color from an Excel-style shaded cell", async ({
    editor,
  }) => {
    const tableHtml = `
      <table>
        <tr>
          <td style="background-color: #ffff00; color: black;"><span style="color: black;">Shaded</span></td>
        </tr>
      </table>
    `

    await editor.paste("Shaded", { html: tableHtml })

    await assertEditorContent(editor, async (content) => {
      const cell = content.locator("table td")
      await expect(cell).toHaveCount(1)

      const styles = await cell.evaluate((el) => ({
        background: el.style.background,
        backgroundColor: el.style.backgroundColor,
        color: el.style.color,
      }))
      expect(styles.background).toBe("")
      expect(styles.backgroundColor).toBe("")
      expect(styles.color).toBe("")

      const styledDescendants = cell.locator('[style*="color"]')
      await expect(styledDescendants).toHaveCount(0)
    })
  })

  // Shading survives as TableCellNode state, so it reappears when previously
  // stored content is loaded back into the editor — a path the paste-time
  // formatter never sees. Normalize it away on load too.
  test("strips shading from cells when loading stored content", async ({
    editor,
  }) => {
    await editor.setValue(`
      <table><tbody>
        <tr>
          <td style="background-color: rgb(255, 255, 0);">Shaded</td>
          <td>Plain</td>
        </tr>
      </tbody></table>
    `)

    const value = await editor.value()
    expect(value).not.toContain("background-color")

    await assertEditorContent(editor, async (content) => {
      const cells = content.locator("table td")
      await expect(cells).toHaveCount(2)

      for (const cell of await cells.all()) {
        const bgColor = await cell.evaluate((el) => el.style.backgroundColor)
        expect(bgColor).toBe("")
      }
    })
  })
})
