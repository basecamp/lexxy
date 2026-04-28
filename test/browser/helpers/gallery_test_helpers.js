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
