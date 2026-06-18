export class UploadRequests {
  #requestsByKey = new Map()

  track(key, request) {
    this.#requestsByKey.set(key, request)
  }

  forget(key) {
    this.#requestsByKey.delete(key)
  }

  abort(key) {
    const request = this.#requestsByKey.get(key)
    if (request) {
      this.#requestsByKey.delete(key)
      request.abort()
    }
  }

  clear() {
    this.#requestsByKey.clear()
  }
}
