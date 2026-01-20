import { defineExtension } from "lexical"
import { ImageGalleryNode } from "../nodes/image_gallery_node"
import { $unwrapNode } from "@lexical/utils"

export const ImageGalleryLexicalExtension = defineExtension({
  dependencies: [ /* TODO: future attachment extension */ ],
  name: "lexxy/image_galleries",
  nodes: [
    ImageGalleryNode
  ],
  register(editor) {
    editor.registerNodeTransform(ImageGalleryNode, $removeEmptyGalleries)
    editor.registerNodeTransform(ImageGalleryNode, $unwrapSoloImages)
  }
})

function $unwrapSoloImages(imageGallery) {
  if (imageGallery.getChildrenSize() == 1) {
    const child = imageGallery.getFirstChild()
    $unwrapNode(imageGallery)
    child.select()
  }
}

// Should happen as `canBeEmpty` is `false`, yet it doesn't happen
function $removeEmptyGalleries(imageGallery) {
  if (imageGallery.isEmpty()) {
    imageGallery.remove()
  }
}

