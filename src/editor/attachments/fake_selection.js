import { createElement } from "../../helpers/html_helper"
import { registerLabelledDecoratorSelection } from "../../helpers/lexical_helper"
import { ListenerBin } from "../../helpers/listener_helper"

// Lexical clears the DOM range whenever a NodeSelection commits, so a screen
// reader in focus mode hears nothing when an attachment becomes selected.
// Parks the range on a visually hidden span carrying the decorator node's label.
export class AttachmentFakeSelection {
  #editor
  #listeners = new ListenerBin()
  #container = this.#buildContainer()
  #currentFigure = null

  constructor(editor) {
    this.#editor = editor

    this.#listeners.track(
      registerLabelledDecoratorSelection(editor, (target) => this.#sync(target))
    )
  }

  destroy() {
    this.#listeners.dispose()
    this.#detach()
    this.#container = null
  }

  #buildContainer() {
    return createElement("span", { className: "lexxy-fake-selection" })
  }

  #sync(target) {
    if (this.#container) {
      if (target) {
        this.#attach(target.key, target.label || "Attachment")
      } else {
        this.#detach()
      }
    }
  }

  #attach(key, label) {
    const figure = this.#editor.getElementByKey(key)
    if (figure) {
      this.#setContainerLabel(label)
      if (this.#currentFigure !== figure) {
        this.#detach()
        figure.appendChild(this.#container)
        this.#currentFigure = figure
      }
      this.#parkDomSelection()
    } else {
      this.#detach()
    }
  }

  #setContainerLabel(text) {
    if (this.#container.textContent !== text) this.#container.textContent = text
  }

  #detach() {
    if (this.#container?.parentNode) this.#container.remove()
    this.#currentFigure = null
  }

  #parkDomSelection() {
    if (this.#canPark && !this.#isAlreadyParked) {
      const domSelection = window.getSelection()
      if (domSelection) {
        const textNode = this.#container.firstChild
        const range = document.createRange()
        range.setStart(textNode, 0)
        range.setEnd(textNode, textNode.length)

        domSelection.removeAllRanges()
        domSelection.addRange(range)
      }
    }
  }

  get #canPark() {
    const root = this.#editor?.getRootElement()
    const active = document.activeElement
    return this.#container?.isConnected
      && this.#container.firstChild != null
      && root != null
      && (root.contains(active) || active === root)
      && active?.tagName !== "TEXTAREA"
      && active?.tagName !== "INPUT"
  }

  get #isAlreadyParked() {
    const domSelection = window.getSelection()
    if (domSelection?.rangeCount === 1) {
      const textNode = this.#container.firstChild
      return domSelection.anchorNode === textNode
        && domSelection.focusNode === textNode
        && domSelection.anchorOffset === 0
        && domSelection.focusOffset === textNode.length
    } else {
      return false
    }
  }
}
