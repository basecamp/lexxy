import { dispatch } from "../helpers/html_helper"

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

  dispatchHighlightColors(colors, backgroundColors) {
    dispatch(this.editorElement, "lexxy:highlight-colors", { colors, backgroundColors })
  }

  freeze(frozenLinkKey) {
    this.frozenLinkKey = frozenLinkKey
    this.editorContentElement.contentEditable = "false"
  }

  thaw() {
    this.editorContentElement.contentEditable = "true"
  }
}
