import Lexxy from "../config/lexxy.js"

export default class Extensions {

  constructor(lexxyElement) {
    this.lexxyElement = lexxyElement

    this.enabledExtensions = this.#initializeExtensions()
  }

  get lexicalExtensions() {
    return this.enabledExtensions.map(ext => ext.lexicalExtension).filter(Boolean)
  }

  initializeToolbars() {
    if (this.#lexxyToolbar) {
      this.enabledExtensions.forEach(ext => ext.initializeToolbar(this.#lexxyToolbar))
    }
  }

  get #lexxyToolbar() {
    return this.lexxyElement.toolbar
  }

  #initializeExtensions() {
    const extensionDefinitions = Lexxy.global.get("extensions")

    return extensionDefinitions.map(
      extension => new extension(this.lexxyElement)
    ).filter(extension => extension.enabled)
  }
}
