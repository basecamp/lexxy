import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

async function pasteHtml(page, editor, html) {
  await page.goto("/")
  await editor.waitForConnected()
  startMonitoringConsole(page)

  await editor.setValue("<p></p>")
  await editor.focus()

  await editor.paste("ignored", { html })
  await editor.flush()
}

// Email clients (Gmail, Apple Mail) lay out messages with nested tables:
// a full-width wrapper, a fixed-width body, and single-cell rows.
const EMAIL_LAYOUT_HTML = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tbody><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tbody>
          <tr><td><p>Hi there,</p><p>Thanks for your order.</p></td></tr>
          <tr><td><p>Cheers,<br>Jane</p></td></tr>
        </tbody>
      </table>
    </td></tr></tbody>
  </table>
`

test.describe("Paste email layout tables", () => {
  test("unwraps nested email layout tables into paragraphs", async ({ page, editor }) => {
    await pasteHtml(page, editor, EMAIL_LAYOUT_HTML)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(0)
      await expect(content.locator("p")).toHaveText([ "Hi there,", "Thanks for your order.", /Cheers,\s*Jane/ ])
    })
    await assertEditorHtml(editor, "<p>Hi there,</p><p>Thanks for your order.</p><p>Cheers,<br>Jane</p>")
    expect(page).toHaveNoErrors()
  })

  test("unwraps a table marked as presentational", async ({ page, editor }) => {
    await pasteHtml(page, editor, `
      <table role="presentation"><tbody><tr><td>Left</td><td>Right</td></tr></tbody></table>
    `)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(0)
      await expect(content.locator("p")).toHaveText([ "Left", "Right" ])
    })
    expect(page).toHaveNoErrors()
  })

  test("unwraps nested layout tables without a presentational role", async ({ page, editor }) => {
    await pasteHtml(page, editor, `
      <table cellpadding="0"><tbody><tr><td>
        <table><tbody><tr><td><div dir="ltr">Sent from my phone</div></td></tr></tbody></table>
      </td></tr></tbody></table>
    `)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(0)
      await expect(content).toContainText("Sent from my phone")
    })
    expect(page).toHaveNoErrors()
  })

  test("keeps a media-only cell of a layout table", async ({ page, editor }) => {
    await pasteHtml(page, editor, `
      <table role="presentation"><tbody>
        <tr><td><video src="https://example.com/clip.mp4"></video></td></tr>
        <tr><td><p>Watch the clip</p></td></tr>
      </tbody></table>
    `)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(0)
      await expect(content.locator("action-text-attachment, figure.attachment, video")).not.toHaveCount(0)
      await expect(content).toContainText("Watch the clip")
    })
    await expect.poll(async () => (await editor.value()).includes("clip.mp4")).toBe(true)
    expect(page).toHaveNoErrors()
  })

  test("keeps the caption of a layout table", async ({ page, editor }) => {
    await pasteHtml(page, editor, `
      <table role="presentation"><caption>Weekly update</caption><tbody>
        <tr><td><p>All good</p></td></tr>
      </tbody></table>
    `)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(0)
      await expect(content.locator("p")).toHaveText([ "Weekly update", "All good" ])
    })
    expect(page).toHaveNoErrors()
  })

  test("keeps a data table that sits inside a layout table", async ({ page, editor }) => {
    await pasteHtml(page, editor, `
      <table role="presentation"><tbody><tr><td>
        <p>Your order:</p>
        <table>
          <tbody>
            <tr><td>Item</td><td>Price</td></tr>
            <tr><td>Book</td><td>$10</td></tr>
          </tbody>
        </table>
      </td></tr></tbody></table>
    `)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(1)
      await expect(content.locator("table td, table th")).toHaveCount(4)
      await expect(content.locator("p").first()).toHaveText("Your order:")
    })
    expect(page).toHaveNoErrors()
  })

  test("keeps a single-column table pasted on its own", async ({ page, editor }) => {
    await pasteHtml(page, editor, `
      <table><tbody><tr><td>Apples</td></tr><tr><td>Pears</td></tr></tbody></table>
    `)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(1)
      await expect(content.locator("table td, table th")).toHaveCount(2)
    })
    expect(page).toHaveNoErrors()
  })

  test("keeps a data table with headers whose cell holds a layout table", async ({ page, editor }) => {
    await pasteHtml(page, editor, `
      <table>
        <thead><tr><th>Item</th><th>Price</th></tr></thead>
        <tbody>
          <tr>
            <td><table role="presentation"><tbody><tr><td>Book</td></tr></tbody></table></td>
            <td>$10</td>
          </tr>
        </tbody>
      </table>
    `)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(1)
      await expect(content.locator("table td, table th")).toHaveCount(4)
      await expect(content.locator("table")).toContainText("Book")
    })
    expect(page).toHaveNoErrors()
  })

  test("keeps a pasted data table", async ({ page, editor }) => {
    await pasteHtml(page, editor, `
      <table>
        <tbody>
          <tr><td>Item</td><td>Price</td></tr>
          <tr><td>Book</td><td>$10</td></tr>
        </tbody>
      </table>
    `)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("table")).toHaveCount(1)
      await expect(content.locator("table td, table th")).toHaveCount(4)
    })
    expect(page).toHaveNoErrors()
  })
})
