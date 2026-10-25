import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Focus preservation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  // Firefox (152+) keeps window.getSelection() anchored inside the editor after focus
  // moves to another field, and fires document selectionchange for every keystroke
  // typed there. Lexical reads that stale selection, reconciles, and pulls focus back
  // into the editor — stealing it mid-typing (BC-10036823881). Other engines move the
  // document selection together with focus, so the stale state cannot be built with
  // real DOM calls here; simulate Firefox's reporting by patching getSelection() to
  // return the stale editor-anchored selection while the title field truly owns focus,
  // then fire selectionchange the way Firefox does for each keystroke.
  test("typing in another field doesn't lose focus to the editor over a stale selection", async ({ page, editor }) => {
    await editor.setValue("<h2>Inventory</h2><table><tbody><tr><td><p>Item</p></td><td><p>Count</p></td></tr></tbody></table>")
    await editor.click()

    const title = page.locator("input[name='post[title]']")
    await title.focus()

    await page.evaluate(() => {
      const content = document.querySelector("lexxy-editor .lexxy-editor__content")
      const anchorNode = content.querySelector("h2").parentElement
      const realSelection = window.getSelection()
      const staleSelection = {
        anchorNode, focusNode: anchorNode, anchorOffset: 0, focusOffset: 1,
        type: "Range", rangeCount: 1, isCollapsed: false,
        getRangeAt() {
          const range = document.createRange()
          range.setStart(anchorNode, 0)
          range.setEnd(anchorNode, 1)
          return range
        },
        setBaseAndExtent(...args) { return realSelection.setBaseAndExtent(...args) },
        removeAllRanges() { return realSelection.removeAllRanges() },
        addRange(range) { return realSelection.addRange(range) },
        extend(...args) { return realSelection.extend(...args) },
        collapse(...args) { return realSelection.collapse(...args) }
      }
      window.__restoreGetSelection = Document.prototype.getSelection
      Document.prototype.getSelection = () => staleSelection
      window.getSelection = () => staleSelection
    })

    for (const character of "abc") {
      await page.evaluate(() => document.dispatchEvent(new Event("selectionchange")))
      await page.keyboard.type(character)
      await expect(title).toBeFocused()
    }

    await expect(title).toHaveValue("abc")
  })

  test("selection updates still focus the editor when no other field owns focus", async ({ page, editor }) => {
    await editor.click()
    await editor.send("Hello")

    await page.evaluate(() => {
      document.activeElement.blur()
      document.dispatchEvent(new Event("selectionchange"))
    })
    await editor.focus()
    await editor.send(" there")

    await expect(editor.content).toBeFocused()
  })
})
