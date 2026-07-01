export class LiveRegion extends HTMLElement {
  connectedCallback() {
    this.ariaLive = "polite"
    this.ariaAtomic = "true"
    this.ariaRelevant = "all"
  }

  disconnectedCallback() {
    this.dispose()
  }

  dispose() {
    this.textContent = ""
  }

  announce(message) {
    if (message) {
      this.textContent = message

      // Clear once the screen reader has had time to speak, so the stale
      // message doesn't appear under the cursor in browse mode.
      requestAnimationFrame(() => requestAnimationFrame(() => this.textContent = ""))
    }
  }
}

export default LiveRegion
