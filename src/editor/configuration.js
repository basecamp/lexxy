import Configuration from "../config/configuration"
import lexxyConfig from "../config/lexxy"
import { dasherize } from "../helpers/string_helper"

export default class EditorConfiguration {
  #editorElement
  #config

  constructor(editorElement) {
    this.#editorElement = editorElement
    this.#config = new Configuration(this.#overrides)
  }

  get(path) {
    return this.#config.get(path)
      ?? lexxyConfig.get(`${this.#editorElement.preset}.${path}`)
      ?? lexxyConfig.get(`default.${path}`)
  }

  get #overrides() {
    const overrides = {}
    for (const option of Object.keys(lexxyConfig.get("default"))) {
      if (this.#editorElement.hasAttribute(option)) {
        overrides[option] = this.#parseAttribute(dasherize(option))
      }
    }
    return overrides
  }

  #parseAttribute(attribute) {
    const value = this.#editorElement.getAttribute(attribute)
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
}
