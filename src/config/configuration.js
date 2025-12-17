import { deepMerge } from "../helpers/hash_helper"

export default class Configuration {
  #tree = {}

  constructor(...configs) {
    this.merge(...configs)
  }

  merge(...configs) {
    return this.#tree = configs.reduce(deepMerge, this.#tree)
  }

  get(path) {
    const keys = path.split(".")
    return keys.reduce((node, key) => node[key], this.#tree)
  }
}
