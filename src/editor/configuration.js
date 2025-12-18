import Configuration from "../config/configuration"
import lexxyConfig from "../config/lexxy"
import { camelize } from "../helpers/string_helper"

export default class EditorConfiguration {
  static attributes = [ "attachments", "markdown", "single-line", "toolbar" ]

  #editorElement
  #config

  constructor(editorElement) {
    this.#editorElement = editorElement
    this.#config = new Configuration(this.#overrides)
  }

  get(path) {
    return this.#config.get(path) ?? lexxyConfig.get(`${this.#editorElement.preset}.${path}`) ?? lexxyConfig.get(`default.${path}`)
  }

  get #overrides() {
    const overrides = {}
    for (const attribute of EditorConfiguration.attributes) {
      if (this.#editorElement.hasAttribute(attribute)) {
        const camelized = camelize(attribute)
        overrides[camelized] = this.#parseAttribute(attribute)
      }
    }
    return overrides
  }

  #parseAttribute(attribute) {
    const value = this.#editorElement.getAttribute(attribute)
    if (value == "true") return true
    if (value == "false") return false
    return value
  }
}
