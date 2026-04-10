import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Formatting after text drag-and-drop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  // Native text drag-and-drop within a contenteditable fires
  // insertFromDrop then deleteByDrag. This sequence can leave
  // Lexical's selection referencing a node that was removed during
  // the operation, causing "Point.getNode: node not found" on
  // subsequent editor actions (Enter, code formatting).
  //
  // Lexxy prevents this by intercepting DRAGSTART_COMMAND for text
  // selections and preventing the default browser behavior, which
  // stops native text D&D before it starts. Attachment D&D is
  // handled separately at higher priority and is not affected.
  test("text dragstart is prevented to avoid stale selection crashes", async ({ page, editor }) => {
    await editor.setValue("<p>Hello world this is some text</p>")
    await editor.select("world")
    await editor.flush()

    // Dispatch a dragstart event on the selected text (not on an
    // attachment figure) — this simulates the browser initiating a
    // native text drag when the user clicks and drags selected text.
    const wasPrevented = await page.evaluate(() => {
      const content = document.querySelector(".lexxy-editor__content")

      const dataTransfer = new DataTransfer()
      dataTransfer.setData("text/plain", "world")

      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      })

      content.dispatchEvent(dragStartEvent)
      return dragStartEvent.defaultPrevented
    })

    expect(wasPrevented).toBe(true)
  })

  test("editor remains functional after prevented text drag attempt", async ({ page, editor }) => {
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.setValue("<p>Hello world this is some text</p>")
    await editor.select("world")
    await editor.flush()

    // Attempt a text drag (will be prevented)
    await page.evaluate(() => {
      const content = document.querySelector(".lexxy-editor__content")
      const dataTransfer = new DataTransfer()
      dataTransfer.setData("text/plain", "world")
      content.dispatchEvent(new DragEvent("dragstart", {
        bubbles: true, cancelable: true, dataTransfer,
      }))
    })

    await editor.flush()

    // Press Enter — should work normally
    await editor.send("Enter")
    await editor.flush()

    const nodeNotFoundErrors = errors.filter(
      (e) =>
        e.includes("node not found") ||
        e.includes("Point.getNode") ||
        e.includes("selection has been lost"),
    )
    expect(nodeNotFoundErrors).toHaveLength(0)
  })

  test("editor remains functional after prevented text drag and code formatting", async ({ page, editor }) => {
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.setValue("<p>Hello world this is some text</p>")
    await editor.select("world")
    await editor.flush()

    // Attempt a text drag (will be prevented)
    await page.evaluate(() => {
      const content = document.querySelector(".lexxy-editor__content")
      const dataTransfer = new DataTransfer()
      dataTransfer.setData("text/plain", "world")
      content.dispatchEvent(new DragEvent("dragstart", {
        bubbles: true, cancelable: true, dataTransfer,
      }))
    })

    await editor.flush()

    // Apply code formatting — should work normally
    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    const nodeNotFoundErrors = errors.filter(
      (e) =>
        e.includes("node not found") ||
        e.includes("Point.getNode") ||
        e.includes("selection has been lost"),
    )
    expect(nodeNotFoundErrors).toHaveLength(0)
  })
})
