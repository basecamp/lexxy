import { test } from "../../test_helper.js"
import { applyHighlightOption } from "../../helpers/toolbar.js"
import { expect } from "@playwright/test"

test.describe("Code block highlight survives editing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("a highlight applied inside a code block survives typing elsewhere", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>due Jul 31.</code></pre>')

    await editor.select("Jul 31")
    await applyHighlightOption(page, "background-color", 1)

    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
      await expect(editor.content.locator("code mark").first()).toContainText("Jul 31")
    }).toPass({ timeout: 5_000 })

    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node, target
      while ((node = walker.nextNode())) {
        if (node.nodeValue.includes(".")) target = node
      }
      const idx = target.nodeValue.lastIndexOf(".")
      const range = document.createRange()
      range.setStart(target, idx)
      range.setEnd(target, idx + 1)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })
    await editor.send("Backspace")

    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
      await expect(editor.content.locator("code mark").first()).toContainText("Jul 31")
    }).toPass({ timeout: 5_000 })
  })

  test("a highlight survives appending characters to the code block", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>due Jul 31</code></pre>')

    await editor.select("Jul 31")
    await applyHighlightOption(page, "background-color", 1)

    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node, last
      while ((node = walker.nextNode())) last = node
      const range = document.createRange()
      range.setStart(last, last.nodeValue.length)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })
    await editor.send(" today")

    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
      await expect(editor.content.locator("code mark").first()).toContainText("Jul 31")
    }).toPass({ timeout: 5_000 })
  })

  test("multiple highlights on different words all survive a later edit", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>12,571 due Jul 31.</code></pre>')

    await editor.select("12,571")
    await applyHighlightOption(page, "color", 1)
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(1)
    }).toPass({ timeout: 5_000 })

    await editor.select("Jul 31")
    await applyHighlightOption(page, "background-color", 1)
    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(2)
    }).toPass({ timeout: 5_000 })

    await editor.content.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node, target
      while ((node = walker.nextNode())) { if (node.nodeValue.includes(".")) target = node }
      const idx = target.nodeValue.lastIndexOf(".")
      const range = document.createRange()
      range.setStart(target, idx)
      range.setEnd(target, idx + 1)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })
    await editor.send("Backspace")

    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toHaveCount(2)
      await expect(editor.content.locator("code mark").nth(0)).toContainText("12,571")
      await expect(editor.content.locator("code mark").nth(1)).toContainText("Jul 31")
    }).toPass({ timeout: 5_000 })
  })
})
