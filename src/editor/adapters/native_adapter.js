import { dispatch } from "../../helpers/html_helper"

export class NativeAdapter {
  frozenLinkKey = null

  constructor(editorElement) {
    this.editorElement = editorElement
    this.editorContentElement = editorElement.editorContentElement
  }

  dispatchAttributesChange(attributes, linkHref, highlight) {
    dispatch(this.editorElement, "lexxy:attributes-change", {
      attributes,
      link: linkHref ? { href: linkHref } : null,
      highlight
    })
  }

  dispatchEditorInitialized(detail) {
    dispatch(this.editorElement, "lexxy:editor-initialized", detail)
  }

  freeze(frozenLinkKey) {
    this.frozenLinkKey = frozenLinkKey
    this.editorContentElement.contentEditable = "false"
  }

  thaw() {
    this.editorContentElement.contentEditable = "true"
  }
}
