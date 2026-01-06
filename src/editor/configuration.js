import Lexxy from "../config/lexxy"
import { dasherize } from "../helpers/string_helper"
import { deepMerge } from "../helpers/hash_helper"

export default class EditorConfiguration {
  #editorElement
  #tree = {}

  static for(editorElement) {
    const config = new EditorConfiguration(editorElement)
    return config.#tree
  }

  constructor(editorElement) {
    this.#editorElement = editorElement
    deepMerge(
      this.#tree,
      Lexxy.default,
      Lexxy[editorElement.preset],
      this.#overrides
    )
  }

  get #overrides() {
    const overrides = {}
    for (const option of Object.keys(Lexxy.default)) {
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
