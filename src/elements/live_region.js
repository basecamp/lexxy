const ANNOUNCE_DEBOUNCE_MS = 50
const CLEAR_AFTER_MS = 1000

export class LiveRegion extends HTMLElement {
  #announceTimeout = null
  #clearAfterTimeout = null

  connectedCallback() {
    this.ariaLive = "polite"
    this.ariaAtomic = "true"
    this.ariaRelevant = "all"
  }

  disconnectedCallback() {
    clearTimeout(this.#announceTimeout)
    clearTimeout(this.#clearAfterTimeout)
  }

  announce(message) {
    if (message) {
      clearTimeout(this.#announceTimeout)
      clearTimeout(this.#clearAfterTimeout)

      // Clearing first lets screen readers observe a change to the new text
      // even when it matches the previous announcement; otherwise they
      // coalesce consecutive identical messages into a single utterance.
      this.textContent = ""
      this.#announceTimeout = setTimeout(() => this.#flush(message), ANNOUNCE_DEBOUNCE_MS)
    }
  }

  #flush(message) {
    if (this.isConnected) {
      this.textContent = message
      // Clear once the screen reader has had time to speak, so the stale
      // message doesn't appear under the cursor in browse mode.
      this.#clearAfterTimeout = setTimeout(() => this.textContent = "", CLEAR_AFTER_MS)
    }
  }
}

export default LiveRegion
