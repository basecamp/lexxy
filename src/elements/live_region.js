import { createElement } from "../helpers/html_helper"

const REMOVAL_DELAY = 1000

export class LiveRegion extends HTMLElement {
  #additions = createElement("span", { ariaLive: "assertive", ariaRelevant: "additions" })
  #removalTimeouts = new Set()
  #transient = createElement("span", { ariaLive: "assertive", ariaAtomic: "true", ariaRelevant: "all" })
  #transientFrames = new Set()

  connectedCallback() {
    this.replaceChildren(this.#transient, this.#additions)
  }

  disconnectedCallback() {
    this.dispose()
  }

  dispose() {
    for (const timeout of this.#removalTimeouts) clearTimeout(timeout)
    this.#removalTimeouts.clear()
    this.#cancelTransientFrames()
    this.#additions.replaceChildren()
    this.#transient.replaceChildren()
    this.replaceChildren()
  }

  announce(message, { transient = false } = {}) {
    if (message) {
      if (typeof document.ariaNotify === "function") {
        this.#announceNatively(message)
      } else if (transient) {
        this.#announceTransient(message)
      } else {
        this.#announceAddition(message)
      }
    }
  }

  #announceNatively(message) {
    document.ariaNotify(message, { priority: "high" })
  }

  #announceAddition(message) {
    const announcement = createElement("div", { textContent: message })
    this.#additions.replaceChildren(announcement)

    const timeout = setTimeout(() => {
      announcement.remove()
      this.#removalTimeouts.delete(timeout)
    }, REMOVAL_DELAY)
    this.#removalTimeouts.add(timeout)
  }

  #announceTransient(message) {
    this.#cancelTransientFrames()
    this.#transient.textContent = message
    this.#requestTransientFrame(() => {
      this.#requestTransientFrame(() => this.#transient.textContent = "")
    })
  }

  #requestTransientFrame(callback) {
    const frame = requestAnimationFrame(() => {
      this.#transientFrames.delete(frame)
      callback()
    })
    this.#transientFrames.add(frame)
  }

  #cancelTransientFrames() {
    for (const frame of this.#transientFrames) cancelAnimationFrame(frame)
    this.#transientFrames.clear()
  }
}

export default LiveRegion
