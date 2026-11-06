import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { openToolbarDropdown } from "../../helpers/toolbar.js"

test.describe("Linking a selection that contains a link", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  // Selects from the start of `from` to the end of `to`, which may sit in
  // different text nodes.
  async function selectAcross(editor, from, to) {
    await editor.focus()
    await editor.content.evaluate((el, { from, to }) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      const range = document.createRange()
      let node
      let started = false
      while ((node = walker.nextNode())) {
        if (!started && node.nodeValue.includes(from)) {
          range.setStart(node, node.nodeValue.indexOf(from))
          started = true
        }
        if (started && node.nodeValue.includes(to)) {
          range.setEnd(node, node.nodeValue.indexOf(to) + to.length)
          break
        }
      }
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    }, { from, to })
    await editor.flush()
  }

  async function linkSelection(page, url) {
    await openToolbarDropdown(page, "link")

    const input = page.locator("lexxy-link-dropdown [data-dropdown-panel] input").first()
    await expect(input).toBeVisible({ timeout: 2_000 })
    await input.fill(url)
    await page
      .locator("lexxy-link-dropdown [data-dropdown-panel] button[value='link']")
      .first()
      .click()
  }

  test("makes one link when the existing link is in the middle", async ({ page, editor }) => {
    await editor.setValue('<p>Say hello <a href="https://old.example.com">to all</a> of you today</p>')
    await selectAcross(editor, "hello", "of you")
    await editor.flush()

    await linkSelection(page, "https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Say <a href="https://37signals.com">hello to all of you</a> today</p>',
    )
  })

  test("makes one link when the selection starts inside the existing link", async ({ page, editor }) => {
    await editor.setValue('<p>Say <a href="https://old.example.com">hello to all</a> of you today</p>')
    await selectAcross(editor, "to all", "of you")
    await editor.flush()

    await linkSelection(page, "https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Say <a href="https://37signals.com">hello to all of you</a> today</p>',
    )
  })

  test("makes one link when the selection ends inside the existing link", async ({ page, editor }) => {
    await editor.setValue('<p>Say hello <a href="https://old.example.com">to all of you</a> today</p>')
    await selectAcross(editor, "hello", "to all")
    await editor.flush()

    await linkSelection(page, "https://37signals.com")

    await assertEditorHtml(
      editor,
      '<p>Say <a href="https://37signals.com">hello to all of you</a> today</p>',
    )
  })
})
