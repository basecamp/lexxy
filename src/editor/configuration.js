import Configuration from "../config/configuration"
import lexxyConfig, { DEFAULT_PRESET } from "../config/lexxy"
import { dasherize } from "../helpers/string_helper"

export default class EditorConfiguration {
  #editorElement
  #config

  constructor(editorElement, preset = "default") {
    this.#editorElement = editorElement
    this.#config = new Configuration(
      lexxyConfig.presets.get("default"),
      lexxyConfig.presets.get(preset),
      this.#overrides
    )
  }

  get(path) {
    return this.#config.get(path)
  }

  get #overrides() {
    const overrides = {}
    for (const option of Object.keys(DEFAULT_PRESET)) {
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
