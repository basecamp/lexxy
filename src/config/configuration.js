export default class Configuration {
  #tree
  #listeners = {}

  constructor(initial = {}) {
    this.#tree = initial
  }

  // returns bools early, null if key is missing
  get(path = "") {
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

  merge(config, into = this.#tree) {
    for (const [ key, value ] of Object.entries(config)) {
      if (this.#arePlainObjects(value, into[key])) {
        this.merge(value, into[key])
      } else {
        into[key] = value
      }
    }

    if (into === this.#tree) {
      this.#notify()
    }

    return into
  }

  listen(path, listener) {
    this.#listeners[listener] = path
    listener(this.get(path))
  }

  #notify() {
    for (const [ listener, path ] of Object.entries(this.#listeners)){
      listener(this.get(path))
    }
  }

  #arePlainObjects(...values) {
    return values.every(value => value.constructor == Object)
  }
}
