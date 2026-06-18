import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

test.describe("Paste list with stray non-<li> children before the first item", () => {
  test("strips a stray <br> and whitespace before the first <ol> item", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()
    startMonitoringConsole(page)

    await editor.setValue("<p></p>")
    await editor.focus()

    await editor.paste("ignored", {
      html: "<ol>\n    <br>\n    <li>First item<br></li>\n    <li>Second item<br></li>\n    <li>Third item<br></li>\n</ol>",
    })
    await editor.flush()

    await assertEditorHtml(
      editor,
      '<ol><li value="1">First item</li><li value="2">Second item</li><li value="3">Third item</li></ol>',
    )
    expect(page).toHaveNoErrors()
  })

  test("strips a stray <br> before the first <ul> item", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    startMonitoringConsole(page)

    await editor.setValue("<p></p>")
    await editor.focus()

    await editor.paste("ignored", {
      html: "<ul>\n    <br>\n    <li>First item<br></li>\n    <li>Second item<br></li>\n</ul>",
    })
    await editor.flush()

    await assertEditorHtml(
      editor,
      '<ul><li value="1">First item</li><li value="2">Second item</li></ul>',
    )
    expect(page).toHaveNoErrors()
  })

  test("strips leading whitespace text before the first <ol> item", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    startMonitoringConsole(page)

    await editor.setValue("<p></p>")
    await editor.focus()

    await editor.paste("ignored", {
      html: "<ol>\n    <li>First item</li>\n    <li>Second item</li>\n</ol>",
    })
    await editor.flush()

    await assertEditorHtml(
      editor,
      '<ol><li value="1">First item</li><li value="2">Second item</li></ol>',
    )
    expect(page).toHaveNoErrors()
  })

  test("strips a leading empty <li> before the first item (HelpScout numbered list)", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    startMonitoringConsole(page)

    await editor.setValue("<p></p>")
    await editor.focus()

    await editor.paste("ignored", {
      html: "<ol><li><br></li><li>New For You</li><li>Bubbled Up</li><li>Previous Notifications</li></ol>",
    })
    await editor.flush()

    await assertEditorHtml(
      editor,
      '<ol><li value="1">New For You</li><li value="2">Bubbled Up</li><li value="3">Previous Notifications</li></ol>',
    )
    expect(page).toHaveNoErrors()
  })

  test("keeps an empty <li> that is not leading", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    startMonitoringConsole(page)

    await editor.setValue("<p></p>")
    await editor.focus()

    await editor.paste("ignored", {
      html: "<ol><li>First item</li><li></li><li>Second item</li></ol>",
    })
    await editor.flush()

    await assertEditorHtml(
      editor,
      '<ol><li value="1">First item</li><li value="2"></li><li value="3">Second item</li></ol>',
    )
    expect(page).toHaveNoErrors()
  })
})
