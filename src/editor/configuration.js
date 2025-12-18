import Configuration from "../config/configuration"
import lexxyConfig from "../config/lexxy"
import { camelize } from "../helpers/string_helper"

export default class EditorConfiguration extends Configuration {
  static attributes = [ "attachments", "markdown", "single-line", "toolbar" ]

  #editorElement

  constructor(editorElement) {
    super()
    this.#editorElement = editorElement
    this.merge(this.#overrides)
  }

  get(path) {
    if (this.#preset) {
      return super.get(path) ?? lexxyConfig.get(`${this.#preset}.${path}`) ?? lexxyConfig.get(`default.${path}`)
    } else {
      return super.get(path) ?? lexxyConfig.get(`default.${path}`)
    }
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

  get #preset() {
    return this.#editorElement.getAttribute("config")
  }

  #parseAttribute(attribute) {
    const value = this.#editorElement.getAttribute(attribute)
    if (value == "true") return true
    if (value == "false") return false
    return value
  }
}
