import { createElement } from "../helpers/html_helper"

const REMOVAL_DELAY = 1000

export class LiveRegion extends HTMLElement {
  #additions = createElement("span", { ariaLive: "assertive", ariaRelevant: "additions" })
  #removalTimeouts = new Set()
  #transient = createElement("span", { ariaLive: "assertive", ariaAtomic: "true", ariaRelevant: "all" })
  #transientFrame

  connectedCallback() {
    this.replaceChildren(this.#transient, this.#additions)
  }

  disconnectedCallback() {
    this.dispose()
  }

  dispose() {
    for (const timeout of this.#removalTimeouts) clearTimeout(timeout)
    this.#removalTimeouts.clear()
    cancelAnimationFrame(this.#transientFrame)
    this.#additions.replaceChildren()
    this.#transient.replaceChildren()
    this.replaceChildren()
  }

  announce(message, { transient = false } = {}) {
    if (transient) {
      this.#announceTransient(message)
    } else {
      this.#announceAddition(message)
    }
  }

  #announceTransient(message) {
    cancelAnimationFrame(this.#transientFrame)
    this.#transient.textContent = message
    this.#transientFrame = requestAnimationFrame(() => {
      this.#transientFrame = requestAnimationFrame(() => this.#transient.textContent = "")
    })
  }

  #announceAddition(message) {
    const announcement = createElement("div", { textContent: message })
    this.#additions.appendChild(announcement)

    const timeout = setTimeout(() => {
      announcement.remove()
      this.#removalTimeouts.delete(timeout)
    }, REMOVAL_DELAY)
    this.#removalTimeouts.add(timeout)
  }
}

export default LiveRegion
