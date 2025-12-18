import { deepMerge } from "../helpers/hash_helper"

export default class Configuration {
  #tree

  constructor(initial = {}) {
    this.#tree = initial
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

  merge(config) {
    return deepMerge(this.#tree, config)
  }
}
