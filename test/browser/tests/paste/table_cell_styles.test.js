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
      const cells = content.locator("table td, table th")
      for (const cell of await cells.all()) {
        const color = await cell.evaluate((el) => el.style.color)
        expect(color).toBe("")
      }

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

  // Excel doesn't color cells inline: it ships a <style> block whose rules
  // (td { color: black }, .xlNN { color: ... }) cascade onto the cells by
  // element and class. That cascaded color rides past the inline-style
  // stripping and the paste canonicalizer, so pasted table text kept a
  // hardcoded color that didn't adapt to the theme. Stripping the foreign
  // <style> block fixes it. The markup below is a real Excel clipboard paste.
  test("strips cascaded text color from a real Excel paste", async ({
    editor,
  }) => {
    const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Excel.Sheet>
<meta name=Generator content="Microsoft Excel 15">
<link id=Main-File rel=Main-File href="file:///C:/Users/Gabriel/AppData/Local/Temp/msohtmlclip1/01/clip.htm">
<link rel=File-List href="file:///C:/Users/Gabriel/AppData/Local/Temp/msohtmlclip1/01/clip_filelist.xml">
<style>
<!--table
	{mso-displayed-decimal-separator:"\\.";
	mso-displayed-thousand-separator:"\\,";}
td
	{padding-top:1px;
	padding-right:1px;
	padding-left:1px;
	mso-ignore:padding;
	color:black;
	font-size:11.0pt;
	font-weight:400;
	font-family:Calibri, sans-serif;
	text-align:general;
	vertical-align:bottom;
	border:none;
	white-space:nowrap;}
.xl63
	{color:#1F4E78;}
.xl64
	{color:red;}
-->
</style>
</head>
<body link="#0563C1" vlink="#954F72">
<table border=0 cellpadding=0 cellspacing=0 width=128 style='border-collapse:collapse;width:96pt'>
 <col width=64 span=2 style='width:48pt'>
 <tr height=20 style='height:15.0pt'>
<!--StartFragment-->
  <td height=20 class=xl63 width=64 style='height:15.0pt;width:48pt'>BLUE</td>
  <td class=xl64 width=64 style='width:48pt'>RED</td>
<!--EndFragment-->
 </tr>
</table>
</body>
</html>`

    await editor.paste("BLUE\tRED", { html: excelHtml })

    await assertEditorContent(editor, async (content) => {
      const cells = content.locator("table td")
      await expect(cells).toHaveCount(2)

      for (const cell of await cells.all()) {
        const color = await cell.evaluate((el) => el.style.color)
        expect(color).toBe("")
      }

      const coloredText = content.locator('table td [style*="color"]')
      await expect(coloredText).toHaveCount(0)
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
