import { deepMerge } from "../helpers/hash_helper"

export default class Configuration {
  #tree = {}

  constructor(...configs) {
    this.merge(...configs)
  }

  merge(...configs) {
    return this.#tree = configs.reduce(deepMerge, this.#tree)
  }

  // returns bools early, null if key is missing
  get(path) {
    let node = this.#tree
    const keys = path.split(".")
    for (const key of keys) {
      if (!Object.hasOwn(node, key)) {
        return null
      }

      node = node[key]
      if (node === true || node === false) {
        return node
      }
    }

    return node
  }
}
