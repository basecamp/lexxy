import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

test.describe("Paste list spacing normalization", () => {
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
