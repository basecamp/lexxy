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
      this.#presetConfig,
      this.#overrides
    )
  }

  get(path) {
    return this.#config.get(path)
  }

  get #presetConfig() {
    const preset = this.#editorElement.preset
    const config = Lexxy.presets.get(preset)

    if (config) {
      return config
    } else {
      console.warn(`Unknown Lexxy preset "${preset}". Falling back to the default preset.`)
      return {}
    }
  }

  get #overrides() {
    const overrides = {}
    for (const option of this.#defaultOptions) {
      const attribute = dasherize(option)
      if (this.#editorElement.hasAttribute(attribute)) {
        overrides[option] = this.#parseAttribute(attribute)
      }
    }
    return overrides
  }

  get #defaultOptions() {
    return Object.keys(Lexxy.presets.get("default"))
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
