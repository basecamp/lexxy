import { $getNodeByKey, $isDecoratorNode } from "lexical"

import { createElement } from "../../helpers/html_helper"
import { $selectedLabelledDecoratorNode } from "../../helpers/lexical_helper"
import { ListenerBin } from "../../helpers/listener_helper"

// Lexical clears the DOM range on NodeSelection, leaving screen readers in focus
// mode to read stray adjacent characters unless we provide a labelled range.
export class AttachmentFakeSelection {
  #editor
  #listeners = new ListenerBin()
  // Inserting and removing selection elements can invalidate host :has() rules
  // and flood screen readers with unrelated accessibility tree changes.
  #containers = new WeakMap()
  #container = null

  constructor(editor) {
    this.#editor = editor
    this.#listeners.track(
      editor.registerUpdateListener(({ editorState, dirtyLeaves }) => {
        editorState.read(() => {
          for (const key of dirtyLeaves) {
            const node = $getNodeByKey(key)
            const figure = editor.getElementByKey(key)
            if (figure && $isDecoratorNode(node) && node.isKeyboardSelectable() && typeof node.label === "string") this.#prepareContainer(figure)
          }
          this.#update($selectedLabelledDecoratorNode())
        })
      })
    )
  }

  destroy() {
    this.#listeners.dispose()
    this.#editor.getRootElement()?.querySelectorAll(".lexxy-fake-selection").forEach(container => container.remove())
    this.#container = null
  }

  #prepareContainer(figure) {
    let container = this.#containers.get(figure)
    if (!container) {
      container = createElement("span", { className: "lexxy-fake-selection", ariaHidden: "true" })
      container.append(document.createTextNode(""))
      this.#containers.set(figure, container)
    }
    if (container.parentNode !== figure) figure.append(container)
    return container
  }

  #update(target) {
    const figure = target && this.#editor.getElementByKey(target.key)
    const previous = this.#container
    if (figure) {
      this.#container = this.#prepareContainer(figure)
      const label = target.label || "Attachment"
      if (this.#container.firstChild.data !== label) this.#container.firstChild.data = label
      this.#container.ariaHidden = "false"
      this.#parkSelection()
    } else {
      this.#container = null
    }
    if (previous && previous !== this.#container) {
      previous.ariaHidden = "true"
      previous.firstChild.data = ""
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

  // Parking the range while a nested control is focused steals its screen reader cursor.
  get #isEditorFocused() {
    const root = this.#editor.getRootElement()
    return root != null && document.activeElement === root
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
