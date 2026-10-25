export class BrowserAdapter {
  frozenLinkKey = null

  dispatchAttributesChange(editorState) {}
  dispatchEditorInitialized(detail) {}
  freeze() {}
  thaw() {}
  unlinkFrozenNode() {
    return false
  }
}
