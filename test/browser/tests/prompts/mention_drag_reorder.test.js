import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Mention drag reorder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mentions.html")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("a mention can be dragged to a new position within a line", async ({ page, editor }) => {
    await insertMention(page, editor)

    await editor.send(" says hello")
    await editor.flush()

    expect(await editor.plainTextValue()).toContain("Zacharias")

    const mention = editor.content.locator("action-text-attachment").first()
    await expect(mention).toBeVisible()
    expect(await mentionIsDraggable(mention)).toBe(true)

    await dragMentionToEndOfLine(editor)
    await editor.flush()

    // After the drag, the mention should sit at the end of the sentence rather than the start.
    const value = await editor.value()
    const mentionPosition = value.indexOf("action-text-attachment")
    const textPosition = value.indexOf("says hello")
    expect(mentionPosition).toBeGreaterThan(textPosition)
  })
})

async function insertMention(page, editor) {
  await editor.send("@")

  const popover = page.locator(".lexxy-prompt-menu--visible")
  await expect(popover).toBeVisible({ timeout: 5_000 })

  await editor.send("Enter")
  await editor.flush()

  await expect(editor.content.locator("action-text-attachment")).toBeVisible({ timeout: 5_000 })
}

async function mentionIsDraggable(mention) {
  return mention.evaluate((el) => el.draggable === true)
}

async function dragMentionToEndOfLine(editor) {
  await editor.content.evaluate((root) => {
    const mention = root.querySelector("action-text-attachment")
    const paragraph = mention.closest("p") || root
    const targetRect = paragraph.getBoundingClientRect()
    const dropX = targetRect.right - 2
    const dropY = targetRect.top + targetRect.height / 2

    const dataTransfer = new DataTransfer()

    const dispatch = (type, target, clientX, clientY) => {
      const event = new DragEvent(type, { bubbles: true, cancelable: true, clientX, clientY })
      Object.defineProperty(event, "dataTransfer", { value: dataTransfer })
      target.dispatchEvent(event)
    }

    const startRect = mention.getBoundingClientRect()
    dispatch("dragstart", mention, startRect.left + 2, startRect.top + startRect.height / 2)

    const dropTarget = document.elementFromPoint(dropX, dropY) || root
    dispatch("dragover", dropTarget, dropX, dropY)
    dispatch("drop", dropTarget, dropX, dropY)
    dispatch("dragend", mention, dropX, dropY)
  })
}
