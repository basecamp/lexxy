import LexxyExtension from "./lexxy_extension"
import { ImageGalleryLexicalExtension } from "../lexical_extensions/gallery_extension"

export default class GalleryExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsAttachments
  }

  get lexicalExtension() {
    return ImageGalleryLexicalExtension
  }
}
