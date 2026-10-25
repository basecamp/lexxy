import { test } from "../../test_helper.js"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Lists inside blockquotes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test.describe("Backspace closing a blank line gap", () => {
    test("backspace on a blank first list item merges the gap instead of stranding a paragraph", async ({ editor }) => {
      await editor.setValue(
        "<blockquote><ul><li value=\"1\"><br></li><li value=\"2\">Second</li><li value=\"3\">Third</li></ul></blockquote>",
      )
      await editor.flush()

      await editor.content.locator("blockquote ul li").first().click()
      await editor.send("Home")
      await editor.send("Backspace")
      await editor.flush()

      await assertEditorHtml(
        editor,
        "<blockquote><ul><li value=\"1\">Second</li><li value=\"2\">Third</li></ul></blockquote>",
      )
    })

    test("backspace after clearing the first bullet's text removes the blank line", async ({ editor }) => {
      await editor.setValue(
        "<blockquote><ul><li value=\"1\">First</li><li value=\"2\">Second</li></ul></blockquote>",
      )
      await editor.flush()

      const firstItem = editor.content.locator("blockquote ul li").first()
      await firstItem.click()
      await editor.locator.evaluate((el) => {
        const li = el.querySelector("blockquote ul li")
        const range = document.createRange()
        range.selectNodeContents(li)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
      })
      await editor.flush()
      await editor.send("Delete")
      await editor.flush()
      await editor.send("Backspace")
      await editor.flush()

      await assertEditorHtml(
        editor,
        "<blockquote><ul><li value=\"1\">Second</li></ul></blockquote>",
      )
    })
  })

  test.describe("Adding bullets inside a quote keeps the quote", () => {
    test("inserting an unordered list on a quoted paragraph lists only that paragraph", async ({ editor }) => {
      await editor.setValue("<blockquote><p>Alpha</p><p>Beta</p></blockquote>")
      await editor.flush()

      await editor.content.locator("blockquote p").nth(1).click()
      await editor.send("Home")
      await editor.locator.evaluate((el) => el.editor.dispatchCommand("insertUnorderedList"))
      await editor.flush()

      await assertEditorHtml(
        editor,
        "<blockquote><p>Alpha</p><ul><li value=\"1\">Beta</li></ul></blockquote>",
      )
    })

    test("re-adding bullets after removing them keeps the quote", async ({ editor }) => {
      await editor.setValue(
        "<blockquote><p>Title</p><ul><li value=\"1\">a</li><li value=\"2\">b</li></ul></blockquote>",
      )
      await editor.flush()

      const selectListItems = () => {
        return editor.locator.evaluate((el) => {
          const items = el.querySelectorAll("blockquote ul li")
          const range = document.createRange()
          range.setStart(items[0].firstChild, 0)
          range.setEnd(items[1].firstChild, items[1].textContent.length)
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(range)
        })
      }

      await editor.content.locator("blockquote ul li").first().click()
      await selectListItems()
      await editor.flush()
      await editor.locator.evaluate((el) => el.editor.dispatchCommand("insertUnorderedList"))
      await editor.flush()

      await assertEditorHtml(
        editor,
        "<blockquote><p>Title</p><p>a</p><p>b</p></blockquote>",
      )

      await editor.locator.evaluate((el) => {
        const paragraphs = el.querySelectorAll("blockquote p")
        const first = paragraphs[paragraphs.length - 2]
        const last = paragraphs[paragraphs.length - 1]
        const range = document.createRange()
        range.setStart(first.firstChild, 0)
        range.setEnd(last.firstChild, last.textContent.length)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
      })
      await editor.flush()
      await editor.locator.evaluate((el) => el.editor.dispatchCommand("insertUnorderedList"))
      await editor.flush()

      await assertEditorHtml(
        editor,
        "<blockquote><p>Title</p><ul><li value=\"1\">a</li><li value=\"2\">b</li></ul></blockquote>",
      )
    })

    test("inserting an ordered list on a quoted paragraph keeps the quote", async ({ editor }) => {
      await editor.setValue("<blockquote><p>Alpha</p><p>Beta</p></blockquote>")
      await editor.flush()

      await editor.content.locator("blockquote p").nth(1).click()
      await editor.send("Home")
      await editor.locator.evaluate((el) => el.editor.dispatchCommand("insertOrderedList"))
      await editor.flush()

      await assertEditorHtml(
        editor,
        "<blockquote><p>Alpha</p><ol><li value=\"1\">Beta</li></ol></blockquote>",
      )
    })
  })
})
