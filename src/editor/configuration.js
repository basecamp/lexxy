import Configuration from "../config/configuration"
import Lexxy from "../config/lexxy"
import { dasherize } from "../helpers/string_helper"

export default class EditorConfiguration {
  #editorElement
  #config

  constructor(editorElement) {
    this.#editorElement = editorElement
    this.#config = new Configuration(
      Lexxy.presets.get("default"),
      Lexxy.presets.get(editorElement.preset),
      this.#overrides
    )
  }

  get(path) {
    return this.#config.get(path)
  }

  get #overrides() {
    const overrides = {}
    for (const option of Object.keys(Lexxy.presets.get("default"))) {
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
