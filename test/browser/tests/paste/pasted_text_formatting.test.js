import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

test.describe("Pasted text formatting", () => {
  test.describe("Cleaning invalid list HTML", () => {
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

  test.describe("Normalizing list spacing", () => {
    test("collapses double breaks before and after a list to a single break", async ({
      page,
      editor,
    }) => {
      await page.goto("/")
      await editor.waitForConnected()
      startMonitoringConsole(page)

      await editor.setValue("<p></p>")
      await editor.focus()

      await editor.paste("ignored", {
        html:
          "<div>Hey folks, here is a list:<br><br>" +
          "<ol><li>one<br></li><li>two<br></li><li>three<br></li></ol>" +
          "<br><br>This should do the trick!<br>Gab</div>",
      })
      await editor.flush()

      await assertEditorHtml(
        editor,
        "<p>Hey folks, here is a list:<br></p>" +
          '<ol><li value="1">one</li><li value="2">two</li><li value="3">three</li></ol>' +
          "<p><br>This should do the trick!<br>Gab</p>",
      )
      expect(page).toHaveNoErrors()
    })

    test("adds a single break after a list when the source has none left after stripping", async ({
      page,
      editor,
    }) => {
      await page.goto("/")
      await editor.waitForConnected()
      startMonitoringConsole(page)

      await editor.setValue("<p></p>")
      await editor.focus()

      await editor.paste("ignored", {
        html:
          "<p>Intro line<br><br></p>" +
          "<ol> <br> <li>one<br></li> <li>two<br></li> <li>three<br></li> </ol>" +
          "<br>This should do the trick!<br>Gab",
      })
      await editor.flush()

      await assertEditorHtml(
        editor,
        "<p>Intro line<br></p>" +
          '<ol><li value="1">one</li><li value="2">two</li><li value="3">three</li></ol>' +
          "<p><br>This should do the trick!<br>Gab</p>",
      )
      expect(page).toHaveNoErrors()
    })
  })
})
