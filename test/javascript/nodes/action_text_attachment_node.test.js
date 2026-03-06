import { expect, test } from "vitest"
import { createEditor, $getRoot, $createParagraphNode } from "lexical"
import { ActionTextAttachmentNode, $createActionTextAttachmentNode } from "../../../src/nodes/action_text_attachment_node"

function withEditor(callback) {
  const editor = createEditor({ nodes: [ActionTextAttachmentNode] })
  const root = document.createElement("div")
  editor.setRootElement(root)

  let result
  editor.update(() => {
    result = callback()
  }, { discrete: true })
  return result
}

test("exportDOM outputs action-text-attachment when sgid is present", () => {
  withEditor(() => {
    const node = $createActionTextAttachmentNode({
      sgid: "test-sgid-123",
      src: "https://example.com/image.jpg",
      contentType: "image/jpeg",
      fileName: "image.jpg",
      fileSize: "12345",
      width: "800",
      height: "600",
      altText: "A photo",
      caption: "",
      previewable: "true"
    })

    const { element } = node.exportDOM()
    expect(element.tagName.toLowerCase()).toBe("action-text-attachment")
    expect(element.getAttribute("sgid")).toBe("test-sgid-123")
    expect(element.getAttribute("content-type")).toBe("image/jpeg")
  })
})

test("exportDOM outputs img when sgid is missing", () => {
  withEditor(() => {
    const node = $createActionTextAttachmentNode({
      src: "https://example.com/image.jpg",
      contentType: "image/*",
      fileName: "image.jpg",
      width: "800",
      height: "600",
      altText: "A photo"
    })

    const { element } = node.exportDOM()
    expect(element.tagName.toLowerCase()).toBe("img")
    expect(element.getAttribute("src")).toBe("https://example.com/image.jpg")
    expect(element.getAttribute("alt")).toBe("A photo")
    expect(element.getAttribute("width")).toBe("800")
    expect(element.getAttribute("height")).toBe("600")
  })
})
