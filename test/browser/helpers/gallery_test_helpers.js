import { expect } from "@playwright/test"

export async function uploadStandaloneAfter(editor, anchorType, filePath) {
  await positionCursorAfterNode(editor, anchorType)
  await editor.send("x", "Enter")
  await editor.uploadFile(filePath)
  await expect(editor.content.locator("figure.attachment--preview > progress")).toHaveCount(0)
  await editor.flush()
  await removeBufferParagraphsBetweenImages(editor)
}

export async function positionCursorAfterNode(editor, anchorType) {
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

export async function selectGalleryImage(page, index, galleryIndex = 0) {
  const gallery = page.locator(".attachment-gallery").nth(galleryIndex)
  await gallery.locator("figure.attachment img").nth(index).click()
}

export async function selectGalleryAtOffset(page, editor, offset, galleryIndex = 0) {
  await editor.locator.evaluate((el, args) => {
    return new Promise((resolve) => {
      el.editor.update(() => {
        const root = el.editor.getEditorState()._nodeMap.get("root")
        const galleries = root.getChildren().filter((c) => c.getType() === "image_gallery")
        if (galleries[args.galleryIndex]) galleries[args.galleryIndex].select(args.offset, args.offset)
      }, { onUpdate: resolve })
    })
  }, { offset, galleryIndex })
}

export async function assertGalleryWithImages(editor, count) {
  const gallery = editor.content.locator(".attachment-gallery").first()
  await expect(gallery).toBeVisible({ timeout: 10_000 })
  await expect(gallery.locator("figure.attachment")).toHaveCount(count)
}

export async function removeBufferParagraphsBetweenImages(editor) {
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
