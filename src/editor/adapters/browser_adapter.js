export class BrowserAdapter {
  frozenLinkKey = null

  dispatchAttributesChange(attributes, linkHref, highlight) {}
  dispatchEditorInitialized(detail) {}
  freeze() {}
  thaw() {}
  unlinkFrozenNode() {
    return false
  }
}
