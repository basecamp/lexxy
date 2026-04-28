import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Gallery", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("uploading multiple images creates a gallery", async ({ editor }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 2)
  })

  test("uploading an image with an image selected creates a gallery", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile("test/fixtures/files/example.png")
    await assertAttachmentVisible(page, "image/png")

    await selectAttachment(page)

    await editor.uploadFile("test/fixtures/files/example2.png")
    await assertGalleryWithImages(editor, 2)
  })

  test("uploading an image and a non-image file does not create a gallery", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/dummy.pdf",
    ])

    await assertAttachmentVisible(page, "image/png")
    await assertAttachmentVisible(page, "application/pdf")
    await assertNoGallery(page)
  })

  test("uploading an image and a non-image file with an image selected creates a gallery and appends file after gallery", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile("test/fixtures/files/example.png")
    await assertAttachmentVisible(page, "image/png")

    await selectAttachment(page)

    await editor.uploadFile([
      "test/fixtures/files/example2.png",
      "test/fixtures/files/dummy.pdf",
    ])

    await assertGalleryWithImages(editor, 2)
    await expect(
      page.locator("figure.attachment[data-content-type='application/pdf']"),
    ).toBeVisible()
    await expect(
      page.locator(
        ".attachment-gallery figure.attachment[data-content-type='application/pdf']",
      ),
    ).toHaveCount(0)
  })

  test("deleting an image from a 2-image gallery unwraps it", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 2)

    await selectGalleryImage(page, 0)
    await editor.send("Delete")

    await assertNoGallery(page)
    await expect(page.locator("figure.attachment--preview")).toHaveCount(1)
  })

  test("clicking different images in gallery changes selection", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
      "test/fixtures/files/example.png",
    ])

    await assertGalleryWithImages(editor, 3)

    await selectGalleryImage(page, 0)
    await assertGalleryImageSelected(page, 0)

    await selectGalleryImage(page, 1)
    await assertGalleryImageSelected(page, 1)

    await selectGalleryImage(page, 2)
    await assertGalleryImageSelected(page, 2)
  })

  test("deleting selected image in gallery removes it", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
      "test/fixtures/files/example.png",
    ])

    await assertGalleryWithImages(editor, 3)

    await selectGalleryImage(page, 1)
    await editor.send("Delete")

    await assertGalleryWithImages(editor, 2)
  })

  test("uploading into an existing gallery adds images", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 2)

    await selectGalleryImage(page, 1)

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertGalleryWithImages(editor, 3)
  })

  test("uploading mixed files into gallery adds images and appends non-images", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 2)
    await selectGalleryImage(page, 0)

    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/dummy.pdf",
    ])

    await assertGalleryWithImages(editor, 3)
    await expect(
      page.locator("figure.attachment[data-content-type='application/pdf']"),
    ).toBeVisible()
    await expect(
      page.locator(
        ".attachment-gallery figure.attachment[data-content-type='application/pdf']",
      ),
    ).toHaveCount(0)
  })

  test("enter in between a dual-image gallery splits it and backspace joins them", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 2)

    await selectGalleryAtOffset(page, editor, 1)
    await editor.send("Enter")

    await assertNoGallery(page)
    await expect(page.locator("figure.attachment--preview")).toHaveCount(2)

    await editor.send("Backspace")

    await assertGalleryWithImages(editor, 2)
  })

  test("enter in middle of gallery splits it and backspace joins them", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 4)

    await selectGalleryAtOffset(page, editor, 2)
    await editor.send("Enter")

    await assertGalleryCount(page, 2)

    await editor.send("Backspace")

    await assertGalleryCount(page, 1)
  })

  test("delete at gallery end absorbs next gallery", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 4)

    await selectGalleryAtOffset(page, editor, 2)
    await editor.send("Enter")

    await assertGalleryCount(page, 2)

    await selectGalleryAtOffset(page, editor, 2, 0)
    await editor.send("Delete")

    await assertGalleryCount(page, 1)
    await assertGalleryWithImages(editor, 4)
  })

  test("backspace at gallery start absorbs previous image", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
      "test/fixtures/files/example.png",
    ])

    await assertGalleryWithImages(editor, 3)

    await selectGalleryAtOffset(page, editor, 1)
    await editor.send("Enter")

    await expect(page.locator("figure.attachment--preview")).toHaveCount(3)
    await assertGalleryWithImages(editor, 2)

    await editor.send("Backspace")

    await assertGalleryWithImages(editor, 3)
  })

  test("delete at gallery end absorbs next image", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 2)

    await uploadStandaloneAfter(editor, "image_gallery", "test/fixtures/files/example.png")
    await assertGalleryWithImages(editor, 2)
    await expect(page.locator("figure.attachment--preview")).toHaveCount(3)

    await selectGalleryNode(editor)
    await editor.send("Delete")

    await assertGalleryWithImages(editor, 3)
  })

  test("backspace at gallery start with empty paragraph above removes paragraph", async ({
    page,
    editor,
  }) => {
    await editor.send("Enter")

    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 2)

    await selectGalleryAtOffset(page, editor, 0)
    await editor.send("Backspace")

    await assertGalleryWithImages(editor, 2)
    await expect(
      editor.content.locator(".attachment-gallery:first-child"),
    ).toBeVisible()
  })

  test("backspace at gallery start with content above moves selection", async ({
    page,
    editor,
  }) => {
    await editor.send("Before")
    await editor.send("Enter")

    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
    ])

    await assertGalleryWithImages(editor, 2)

    await selectGalleryAtOffset(page, editor, 0)
    await editor.send("Backspace")

    await assertGalleryWithImages(editor, 2)
    await expect(editor.content).toContainText("Before")
  })

  test("gallery maintains correct count class", async ({
    page,
    editor,
  }) => {
    await editor.uploadFile([
      "test/fixtures/files/example.png",
      "test/fixtures/files/example2.png",
      "test/fixtures/files/example.png",
    ])

    await expect(
      page.locator(".attachment-gallery.attachment-gallery--3"),
    ).toBeVisible()

    await selectGalleryImage(page, 0)
    await editor.send("Delete")

    await expect(
      page.locator(".attachment-gallery.attachment-gallery--2"),
    ).toBeVisible()
  })
})

// --- Helpers ---

async function assertAttachmentVisible(page, contentType) {
  await expect(
    page.locator(`figure.attachment[data-content-type='${contentType}']`),
  ).toBeVisible({ timeout: 10_000 })
}

async function assertGalleryWithImages(editor, count) {
  const gallery = editor.content.locator(".attachment-gallery").first()
  await expect(gallery).toBeVisible({ timeout: 10_000 })
  await expect(gallery.locator("figure.attachment")).toHaveCount(count)
}

async function assertNoGallery(page) {
  await expect(page.locator(".attachment-gallery")).toHaveCount(0)
}

async function assertGalleryCount(page, count) {
  await expect(page.locator(".attachment-gallery")).toHaveCount(count)
}

async function selectGalleryImage(page, index, galleryIndex = 0) {
  const gallery = page.locator(".attachment-gallery").nth(galleryIndex)
  await gallery.locator("figure.attachment img").nth(index).click()
}

async function assertGalleryImageSelected(page, index, galleryIndex = 0) {
  const gallery = page.locator(".attachment-gallery").nth(galleryIndex)
  const figure = gallery.locator("figure.attachment").nth(index)
  await expect(figure).toHaveClass(/node--selected/)
}

async function selectAttachment(page) {
  await page.locator("figure.attachment img[src*='/blobs/']").waitFor()
  await page.locator("figure.attachment img").click()
  await expect(page.locator("figure.attachment")).toHaveClass(/node--selected/)
}

// Mirrors Ruby helper: select image and use arrow keys to position cursor at offset
async function selectGalleryAtOffset(page, editor, offset, galleryIndex = 0) {
  if (offset === 0) {
    await selectGalleryImage(page, 0, galleryIndex)
    await editor.send("ArrowLeft")
  } else {
    await selectGalleryImage(page, offset - 1, galleryIndex)
    await editor.send("ArrowRight")
  }
}

async function uploadStandaloneAfter(editor, anchorType, filePath) {
  await positionCursorAfterNode(editor, anchorType)
  await editor.send("x", "Enter")
  await editor.uploadFile(filePath)
  await expect(editor.content.locator("figure.attachment--preview > progress")).toHaveCount(0)
  await editor.flush()
  await removeBufferParagraphsBetweenImages(editor)
}

async function positionCursorAfterNode(editor, anchorType) {
  await editor.locator.evaluate((el, type) => {
    return new Promise((resolve) => {
      el.editor.update(() => {
        const root = el.editor.getEditorState()._nodeMap.get("root")
        for (const child of root.getChildren()) {
          if (child.getType() === type) {
            const next = child.getNextSibling()
            if (next?.getType() === "provisonal_paragraph") {
              next.selectStart()
            } else {
              child.selectNext(0, 0)
            }
            return
          }
        }
      }, { onUpdate: resolve })
    })
  }, anchorType)
}

async function removeBufferParagraphsBetweenImages(editor) {
  await editor.locator.evaluate((el) => {
    return new Promise((resolve) => {
      el.editor.update(() => {
        const root = el.editor.getEditorState()._nodeMap.get("root")
        const isImageNode = (n) =>
          n?.getType() === "action_text_attachment" || n?.getType() === "image_gallery"
        for (const node of root.getChildren()) {
          const type = node.getType()
          if (type !== "paragraph" && type !== "provisonal_paragraph") continue
          if (!isImageNode(node.getPreviousSibling()) || !isImageNode(node.getNextSibling())) continue
          if (node.getTextContent().replace(/x/g, "") === "") node.remove()
        }
      }, { onUpdate: resolve })
    })
  })
}

async function selectGalleryNode(editor, galleryIndex = 0) {
  await editor.locator.evaluate((el, idx) => {
    return new Promise((resolve) => {
      el.editor.update(() => {
        const root = el.editor.getEditorState()._nodeMap.get("root")
        const galleries = root.getChildren().filter((c) => c.getType() === "image_gallery")
        if (galleries[idx]) galleries[idx].select()
      }, { onUpdate: resolve })
    })
  }, galleryIndex)
}
