import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"
import { assertGalleryWithImages, selectGalleryAtOffset, selectGalleryImage } from "../../helpers/gallery_test_helpers.js"

test.describe("Drop in gallery", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("dropping a file on the right side of the cursor inserts at the cursor position", async ({
    page,
    editor,
  }) => {
    // Setup: create a gallery with 2 images
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 2)

    // Position cursor between the two images (offset 1 in the gallery)
    await selectGalleryAtOffset(page, editor, 1)

    // Simulate a file drop where the browser does NOT move the DOM selection.
    // In real browsers, the drop event fires but the DOM selection stays at
    // the cursor position (offset 1). The drop handler should use the cursor
    // position to determine insertion, not the browser's visual drop target.
    //
    // We dispatch a synthetic drop event with files, mimicking the real browser
    // behavior where the DOM selection is stale (already at offset 1).
    await dropFileAtCurrentSelection(page, editor)

    // The new image should land at position 1 (between the two original images),
    // giving us a gallery with 3 images where the dropped image is in the middle.
    await assertGalleryWithImages(editor, 3)

    // Verify the dropped image is at position 1 (between the two originals).
    // The original images are example.png and example2.png.
    // The dropped image is also example.png but with a different blob URL.
    const gallery = editor.content.locator(".attachment-gallery").first()
    const images = gallery.locator("figure.attachment")
    await expect(images).toHaveCount(3)

    // The first image should be the original first image (example.png)
    const firstImage = images.nth(0)
    const firstSrc = await firstImage.locator("img").getAttribute("src")

    // The second image should be the dropped one (inserted at cursor position 1)
    const secondImage = images.nth(1)
    const secondSrc = await secondImage.locator("img").getAttribute("src")

    // The third image should be the original second image (example2.png)
    const thirdImage = images.nth(2)
    const thirdSrc = await thirdImage.locator("img").getAttribute("src")

    // The dropped image (second) should be different from the first original
    // and the third should still be example2.png
    expect(thirdSrc).toContain("example2.png")
    expect(secondSrc).not.toEqual(firstSrc)
  })
})

// --- Helpers ---

/**
 * Simulates an external file drop at the current selection position.
 *
 * In real browsers, when a user drags a file from the OS file manager and
 * drops it on the editor, the browser does NOT update the DOM selection to
 * the drop coordinates. The "drag caret" shown during dragging is purely
 * visual. The DOM selection stays wherever it was before the drag started.
 *
 * This means the drop handler receives an event where:
 * - event.clientX/clientY point to where the user dropped
 * - The DOM selection still reflects the pre-drag cursor position
 *
 * We simulate this by dispatching a drop event with a file payload while
 * the DOM selection is already positioned where we want the file to land.
 * The drop coordinates are set to a position to the RIGHT of the current
 * cursor, which in a real browser would be at a different gallery position
 * than the cursor.
 */
async function dropFileAtCurrentSelection(page, editor) {
  await editor.content.evaluate(async (contentEl) => {
    // First, dispatch a dragenter event so the editor saves the current selection.
    // In real browsers, dragenter fires when the drag first enters the editor area,
    // at which point the DOM selection still reflects the user's cursor position.
    const dragEnterEvent = new DragEvent("dragenter", {
      bubbles: true,
      cancelable: true,
    })
    contentEl.dispatchEvent(dragEnterEvent)

    // Create a minimal File object for the drop
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"))
    const file = new File([blob], "dropped.png", { type: "image/png" })

    // Build a DataTransfer with the file
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)

    // Get the bounding rect of the second gallery image to simulate dropping
    // to the RIGHT of the cursor (the cursor is between images 0 and 1)
    const gallery = contentEl.querySelector(".attachment-gallery")
    const secondImage = gallery.querySelectorAll("figure.attachment")[1]
    const rect = secondImage.getBoundingClientRect()

    // Dispatch the drop event with coordinates pointing to the right of the cursor
    // (at the second image), but the saved selection from dragenter is at offset 1
    const dropEvent = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer,
      clientX: rect.right - 5,
      clientY: rect.top + rect.height / 2,
    })

    contentEl.dispatchEvent(dropEvent)
  })

  // Wait for the upload to complete
  await expect(
    editor.content.locator(".attachment-gallery figure.attachment"),
  ).toHaveCount(3, { timeout: 10_000 })
}
