export class BrowserAdapter {
  frozenLinkKey = null

  dispatchAttributesChange(editorOrState) {}
  dispatchEditorInitialized(detail) {}
  freeze() {}
  thaw() {}
  unlinkFrozenNode() {
    return false
  }
}
