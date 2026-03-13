import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../helpers/assertions.js"
import { mockActiveStorageUploads } from "../helpers/active_storage_mock.js"

test.describe("Attachments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("upload image", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await expect(figure.locator("img")).toHaveAttribute(
      "src",
      /\/rails\/active_storage\/blobs\/mock-signed-id-\d+\/example\.png/,
    )
    await expect(figure.locator("figcaption textarea")).toHaveAttribute(
      "placeholder",
      "example.png",
    )

    await expect(page.locator("[data-event='lexxy:upload-start']")).toHaveCount(1)
    await expect(page.locator("[data-event='lexxy:upload-end']")).toHaveCount(1)
  })

  test("upload non previewable attachment", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/note.txt")

    const figure = page.locator("figure.attachment[data-content-type='text/plain']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await expect(figure.locator("img")).toHaveCount(0)
    await expect(figure.locator(".attachment__name")).toHaveText("note.txt")
  })

  test("delete attachment with keyboard", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await figure.locator("img").click()
    await editor.send("Delete")

    await expect(figure).toHaveCount(0)
    await assertEditorHtml(editor, "")
  })

  test("delete attachment with delete button", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await figure.locator("img").click()
    await expect(page.locator("lexxy-node-delete-button")).toBeVisible()
    await page.locator("lexxy-node-delete-button button[aria-label='Remove']").click()

    await expect(figure).toHaveCount(0)
    await assertEditorHtml(editor, "")
  })

  test("caption syncs and editor has focus after Enter", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = page.locator("figure.attachment figcaption textarea")
    await expect(caption).toBeVisible({ timeout: 10_000 })

    await caption.click()
    await caption.pressSequentially("My caption")
    await caption.press("Enter")

    await assertEditorHasFocus(editor)
    await assertEditorValueContains(editor, 'caption="My caption"')
  })

  test("caption saves and editor has focus after click", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = page.locator("figure.attachment figcaption textarea")
    await expect(caption).toBeVisible({ timeout: 10_000 })

    await caption.click()
    await caption.pressSequentially("My caption")

    // Blur the caption first to trigger the save, then click editor content
    await caption.evaluate((el) => el.blur())
    await editor.flush()
    await editor.content.click()

    await assertEditorHasFocus(editor)
    await assertEditorValueContains(editor, 'caption="My caption"')
  })

  test("caption saves and editor has focus after Tab", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    const caption = page.locator("figure.attachment figcaption textarea")
    await expect(caption).toBeVisible({ timeout: 10_000 })

    await caption.click()
    await caption.pressSequentially("My caption")

    // Blur the caption first to trigger the save, then press Tab
    await caption.evaluate((el) => el.blur())
    await editor.flush()
    await caption.press("Tab")

    await assertEditorValueContains(editor, 'caption="My caption"')
  })

  test("dropped image lands at drop position, not at cursor", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.setValue("<p>First paragraph</p><p>Second paragraph</p>")
    await editor.flush()

    // Place cursor at end of second paragraph (stale position before drag)
    const secondParagraph = editor.content.locator("p").nth(1)
    await secondParagraph.click()
    await editor.send("End")
    await editor.flush()

    // Drop target: first paragraph
    const firstParagraph = editor.content.locator("p").first()
    const firstParagraphBox = await firstParagraph.boundingBox()
    const dropX = firstParagraphBox.x + firstParagraphBox.width / 2
    const dropY = firstParagraphBox.y + firstParagraphBox.height / 2

    await simulateExternalFileDrop(page, editor, {
      dropX, dropY,
      fileName: "dropped.png",
      mimeType: "image/png"
    })

    const figure = page.locator("figure.attachment")
    await expect(figure).toBeVisible({ timeout: 10_000 })
    await editor.flush()

    // Attachment should appear between the two paragraphs, not after the second
    const children = await editor.content.evaluate((el) => {
      return Array.from(el.children).map((child) => {
        if (child.tagName === "P") return `p:${child.textContent}`
        if (child.tagName === "FIGURE") return "figure"
        if (child.querySelector("figure")) return "figure-wrapper"
        return child.tagName.toLowerCase()
      })
    })
    const firstIdx = children.findIndex(c => c === "p:First paragraph")
    const secondIdx = children.findIndex(c => c === "p:Second paragraph")
    const figureIdx = children.findIndex(c => c === "figure" || c === "figure-wrapper")

    expect(figureIdx).toBeGreaterThan(firstIdx)
    expect(figureIdx).toBeLessThan(secondIdx)
  })
})

async function assertEditorHasFocus(editor) {
  await expect.poll(() => editor.content.evaluate(
    (el) => document.activeElement === el || el.contains(document.activeElement),
  )).toBe(true)
}

async function assertEditorValueContains(editor, substring) {
  await expect.poll(async () => {
    await editor.flush()
    return await editor.value()
  }, { timeout: 5_000 }).toContain(substring)
}

// Simulates a file drop from an external source (e.g., the OS file manager).
// During a real external drag, the browser does NOT update the DOM selection to
// the drop coordinates — the drag caret is purely visual. We intercept the drop
// event, restore the stale DOM selection, and call dropFiles with coordinates so
// it uses caretRangeFromPoint to position the caret at the actual drop point.
async function simulateExternalFileDrop(page, editor, { dropX, dropY, fileName, mimeType }) {
  await page.evaluate(
    ({ dropX, dropY, fileName, mimeType, editorSelector }) => {
      const editorElement = document.querySelector(editorSelector)
      const root = editorElement.editor.getRootElement()

      const sel = window.getSelection()
      const staleAnchorNode = sel.anchorNode
      const staleAnchorOffset = sel.anchorOffset
      const staleFocusNode = sel.focusNode
      const staleFocusOffset = sel.focusOffset

      root.addEventListener("drop", (event) => {
        event.preventDefault()
        event.stopImmediatePropagation()

        const sel = window.getSelection()
        sel.setBaseAndExtent(staleAnchorNode, staleAnchorOffset, staleFocusNode, staleFocusOffset)
        editorElement.editor._pendingEditorState = null

        const files = Array.from(event.dataTransfer.files)
        if (files.length) {
          editorElement.contents.dropFiles(files, {
            clientX: event.clientX,
            clientY: event.clientY
          })
          editorElement.editor.focus()
        }
      }, { capture: true, once: true })

      const file = new File(["fake data"], fileName, { type: mimeType })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      root.dispatchEvent(new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        clientX: dropX,
        clientY: dropY,
        dataTransfer
      }))
    },
    { dropX, dropY, fileName, mimeType, editorSelector: editor.selector }
  )
}
