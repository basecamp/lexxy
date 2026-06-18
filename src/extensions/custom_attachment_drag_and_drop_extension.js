import { defineExtension } from "lexical"
import { CustomAttachmentDragAndDrop } from "../editor/attachments/custom/drag_and_drop"
import LexxyExtension from "./lexxy_extension"

export class CustomAttachmentDragAndDropExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/custom-attachment-drag-and-drop",
      register: (editor) => {
        const dragAndDrop = new CustomAttachmentDragAndDrop(editor)
        return () => dragAndDrop.destroy()
      }
    })
  }
}
