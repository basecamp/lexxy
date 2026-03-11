// EditorHandle wraps a <lexxy-editor> element, mirroring the Ruby EditorHandler.
export class EditorHandle {
  constructor(page, selector = "lexxy-editor") {
    this.page = page
    this.selector = selector
    this.locator = page.locator(selector)
    this.content = this.locator.locator(".lexxy-editor__content")
  }

  async waitForConnected() {
    await this.locator.waitFor({ state: "attached" })
    await this.page.waitForSelector(`${this.selector}[connected]`)
  }

  async value() {
    return this.locator.evaluate((el) => el.value)
  }

  async setValue(html) {
    await this.locator.evaluate((el, h) => (el.value = h), html)
  }

  async plainTextValue() {
    return this.locator.evaluate((el) => el.toString())
  }

  async isEmpty() {
    return this.locator.evaluate((el) => el.isEmpty)
  }

  async isBlank() {
    return this.locator.evaluate((el) => el.isBlank)
  }

  async focus() {
    await this.content.focus()
  }

  async click() {
    await this.content.click()
  }

  // Type text sequentially, or press special keys.
  // Usage: editor.send("Hello") or editor.send("Enter") or editor.send("Shift+Tab")
  async send(...keys) {
    await this.#ensureFirstInteraction()
    for (const key of keys) {
      if (this.#isSpecialKey(key)) {
        await this.content.press(key)
      } else {
        await this.content.pressSequentially(key)
      }
      await this.flush()
    }
  }

  async select(text) {
    await this.#ensureFirstInteraction()
    await this.content.evaluate((el, t) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode())) {
        const idx = node.nodeValue.indexOf(t)
        if (idx !== -1) {
          const range = document.createRange()
          range.setStart(node, idx)
          range.setEnd(node, idx + t.length)
          const sel = window.getSelection()
          sel.removeAllRanges()
          sel.addRange(range)
          break
        }
      }
    }, text)
  }

  async selectAll() {
    await this.#ensureFirstInteraction()
    await this.content.evaluate((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    })
  }

  async paste(text, { html } = {}) {
    await this.#ensureFirstInteraction()
    await this.content.evaluate(
      (el, { text, html }) => {
        const event = new ClipboardEvent("paste", {
          bubbles: true,
          cancelable: true,
          clipboardData: new DataTransfer(),
        })
        event.clipboardData.setData("text/plain", text)
        if (html) event.clipboardData.setData("text/html", html)
        el.dispatchEvent(event)
      },
      { text, html },
    )
  }

  async sendTab({ shift = false } = {}) {
    await this.#ensureFirstInteraction()
    await this.content.evaluate((el, shift) => {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Tab",
        code: "Tab",
        keyCode: 9,
        shiftKey: shift,
      })
      el.dispatchEvent(event)
    }, shift)
  }

  async clickToolbarButton(command, toolbarSelector = "lexxy-toolbar") {
    await this.page
      .locator(`${toolbarSelector} [data-command="${command}"]`)
      .click()
  }

  async flush() {
    await this.locator.evaluate((el) => {
      return new Promise((resolve) => {
        el.editor.update(
          () => {},
          { onUpdate: () => requestAnimationFrame(resolve) },
        )
      })
    })
  }

  async innerHTML() {
    return this.content.evaluate((el) => el.innerHTML)
  }

  async clickTableButton(ariaLabel) {
    await this.locator
      .locator(`lexxy-table-tools button[aria-label='${ariaLabel}']`)
      .first()
      .click()
  }

  async openTableRowMenu() {
    await this.locator
      .locator("lexxy-table-tools .lexxy-table-control--row details")
      .click()
  }

  async openTableColumnMenu() {
    await this.locator
      .locator("lexxy-table-tools .lexxy-table-control--column details")
      .click()
  }

  // Private

  #firstInteraction = false

  async #ensureFirstInteraction() {
    if (!this.#firstInteraction) {
      const isActive = await this.content.evaluate(
        (el) => document.activeElement === el,
      )
      if (!isActive) {
        await this.content.click()
      }
      this.#firstInteraction = true
    }
  }

  #isSpecialKey(key) {
    const specialKeys = [
      "Enter",
      "Tab",
      "Backspace",
      "Delete",
      "Escape",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ]
    // Matches "Shift+Tab", "Control+a", "Meta+z", etc.
    if (/^(Shift|Control|Alt|Meta)\+/.test(key)) return true
    return specialKeys.includes(key)
  }
}
