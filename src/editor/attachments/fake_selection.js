import { createElement } from "../../helpers/html_helper"
import { registerLabelledDecoratorSelection } from "../../helpers/lexical_helper"
import { ListenerBin } from "../../helpers/listener_helper"

// Lexical clears the DOM range whenever a NodeSelection commits. With no range
// anchored anywhere meaningful, a screen reader in focus mode reads whatever
// the browser leaves selected, often stray characters next to the attachment
// instead of the attachment itself. Parks the range on a visually hidden span
// carrying the decorator's label so the announcement matches what was selected.
export class AttachmentFakeSelection {
  #editor
  #listeners = new ListenerBin()
  #container = createElement("span", { className: "lexxy-fake-selection" })

  constructor(editor) {
    this.#editor = editor
    this.#listeners.track(
      registerLabelledDecoratorSelection(editor, (target) => this.#update(target))
    )
  }

  destroy() {
    this.#listeners.dispose()
    this.#container.remove()
    this.#container = null
  }

  #update(target) {
    if (this.#container) {
      const figure = target && this.#editor.getElementByKey(target.key)
      if (figure) {
        const label = target.label || "Attachment"
        if (this.#container.textContent !== label) this.#container.textContent = label
        if (this.#container.parentNode !== figure) figure.append(this.#container)
        this.#parkSelection()
      } else {
        this.#container.remove()
      }
    }
  }

  #parkSelection() {
    const textNode = this.#container.firstChild
    if (textNode && this.#isEditorFocused && !this.#isAlreadyParkedHere) {
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, textNode.length)

      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  get #isEditorFocused() {
    const root = this.#editor.getRootElement()
    const active = document.activeElement
    return root != null
      && (root.contains(active) || active === root)
      && active?.tagName !== "TEXTAREA"
      && active?.tagName !== "INPUT"
  }

  get #isAlreadyParkedHere() {
    const selection = window.getSelection()
    if (selection?.rangeCount === 1) {
      const textNode = this.#container.firstChild
      return selection.anchorNode === textNode
        && selection.focusNode === textNode
        && selection.anchorOffset === 0
        && selection.focusOffset === textNode.length
    } else {
      return false
    }
  }
}
