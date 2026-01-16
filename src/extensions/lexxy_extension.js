export default class LexxyExtension {
  #editorElement

  constructor(editorElement) {
    this.#editorElement = editorElement
  }

  get editorElement() {
    return this.#editorElement
  }

  get editorConfig() {
    return this.#editorElement.config
  }

  // optional: defaults to true
  get enabled() {
    return true
  }

  get lexicalExtension() {
    return null
  }

  initializeToolbar(_lexxyToolbar) {

  }
}
