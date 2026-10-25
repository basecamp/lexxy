export class BrowserAdapter {
  frozenLinkKey = null

  dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {}
  dispatchEditorInitialized(detail) {}
  freeze() {}
  thaw() {}
  unlinkFrozenNode() {
    return false
  }
}
