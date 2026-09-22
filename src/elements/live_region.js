import { createElement } from "../helpers/html_helper"

const REMOVAL_DELAY = 1000

export class LiveRegion extends HTMLElement {
  #additions = createElement("span", { ariaLive: "assertive", ariaRelevant: "additions" })
  #removalTimeouts = new Set()

  connectedCallback() {
    this.replaceChildren(this.#additions)
  }

  disconnectedCallback() {
    this.dispose()
  }

  dispose() {
    for (const timeout of this.#removalTimeouts) clearTimeout(timeout)
    this.#removalTimeouts.clear()
    this.#additions.replaceChildren()
    this.replaceChildren()
  }

  announce(message) {
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
