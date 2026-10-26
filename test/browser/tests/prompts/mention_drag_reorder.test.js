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

  test("a mention can be dragged between two adjacent mentions with no spaces", async ({ editor }) => {
    await editor.setValue(threeAdjacentMentions())
    await editor.flush()

    await expect(editor.content.locator("action-text-attachment")).toHaveCount(3)
    expect(sgidOrder(await editor.value())).toEqual([ "zacharias", "alice", "bob" ])

    await dragMentionBeforeSibling(editor, 2, 1)
    await editor.flush()

    expect(sgidOrder(await editor.value())).toEqual([ "zacharias", "bob", "alice" ])
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

function threeAdjacentMentions() {
  return `<p>${mentionHtml("zacharias", "Zacharias")}${mentionHtml("alice", "Alice")}${mentionHtml("bob", "Bob")}</p>`
}

function mentionHtml(sgid, name) {
  const content = `<span class=&quot;person person--inline&quot;><span class=&quot;person--name&quot;>${name}</span></span>`
  return `<action-text-attachment sgid="test-sgid-${sgid}" content="${content}" content-type="application/vnd.actiontext.mention"></action-text-attachment>`
}

async function mentionIsDraggable(mention) {
  return mention.evaluate((el) => el.draggable === true)
}

function sgidOrder(value) {
  return [ ...value.matchAll(/sgid="test-sgid-([^"]+)"/g) ].map((match) => match[1])
}

// Drag the mention at sourceIndex and drop it just before the mention at targetIndex.
async function dragMentionBeforeSibling(editor, sourceIndex, targetIndex) {
  await editor.content.evaluate((root, { sourceIndex, targetIndex }) => {
    const mentions = root.querySelectorAll("action-text-attachment")
    const source = mentions[sourceIndex]
    const target = mentions[targetIndex]

    const targetRect = target.getBoundingClientRect()
    const dropX = targetRect.left + 2
    const dropY = targetRect.top + targetRect.height / 2

    const dataTransfer = new DataTransfer()

    const dispatch = (type, element, clientX, clientY) => {
      const event = new DragEvent(type, { bubbles: true, cancelable: true, clientX, clientY })
      Object.defineProperty(event, "dataTransfer", { value: dataTransfer })
      element.dispatchEvent(event)
    }

    const startRect = source.getBoundingClientRect()
    dispatch("dragstart", source, startRect.left + 2, startRect.top + startRect.height / 2)

    const dropTarget = document.elementFromPoint(dropX, dropY) || root
    dispatch("dragover", dropTarget, dropX, dropY)
    dispatch("drop", dropTarget, dropX, dropY)
    dispatch("dragend", source, dropX, dropY)
  }, { sourceIndex, targetIndex })
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
