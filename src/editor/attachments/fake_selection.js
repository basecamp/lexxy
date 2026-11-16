import { $getNodeByKey, $isDecoratorNode } from "lexical"

import { createElement } from "../../helpers/html_helper"
import { $selectedLabelledDecoratorNode } from "../../helpers/lexical_helper"
import { ListenerBin } from "../../helpers/listener_helper"

// Lexical clears the DOM range on NodeSelection, leaving screen readers in focus
// mode to read stray adjacent characters unless we provide a labelled range.
export class AttachmentFakeSelection {
  #editor
  #listeners = new ListenerBin()
  #selectionLabels = new WeakMap()
  #activeLabelElement = null

  constructor(editor) {
    this.#editor = editor
    this.#listeners.track(
      editor.registerUpdateListener(({ editorState, dirtyLeaves }) => {
        editorState.read(() => {
          this.#prepareSelectionLabels(dirtyLeaves)
          this.#updateSelection($selectedLabelledDecoratorNode())
        })
      })
    )
  }

  destroy() {
    this.#listeners.dispose()
    const root = this.#editor.getRootElement()
    if (root) {
      root.querySelectorAll(".lexxy-fake-selection").forEach(labelElement => labelElement.remove())
    }
    this.#activeLabelElement = null
  }

  #prepareSelectionLabels(nodeKeys) {
    for (const key of nodeKeys) {
      const node = $getNodeByKey(key)
      const attachmentElement = this.#editor.getElementByKey(key)
      if (attachmentElement
        && $isDecoratorNode(node)
        && node.isKeyboardSelectable()
        && typeof node.label === "string") {
        this.#prepareSelectionLabel(attachmentElement)
      }
    }
  }

  #prepareSelectionLabel(attachmentElement) {
    // Inserting and removing selection elements can invalidate host :has() rules
    // and flood screen readers with unrelated accessibility tree changes.
    let labelElement = this.#selectionLabels.get(attachmentElement)
    if (!labelElement) {
      labelElement = createElement("span", { className: "lexxy-fake-selection", ariaHidden: "true" })
      labelElement.append(document.createTextNode(""))
      this.#selectionLabels.set(attachmentElement, labelElement)
    }
    if (labelElement.parentNode !== attachmentElement) {
      attachmentElement.append(labelElement)
    }
    return labelElement
  }

  #updateSelection(selectedAttachment) {
    const attachmentElement = selectedAttachment && this.#editor.getElementByKey(selectedAttachment.key)
    const previousLabelElement = this.#activeLabelElement

    if (attachmentElement) {
      this.#activeLabelElement = this.#prepareSelectionLabel(attachmentElement)
      const labelText = selectedAttachment.label || "Attachment"
      if (this.#activeLabelElement.firstChild.data !== labelText) {
        this.#activeLabelElement.firstChild.data = labelText
      }
      this.#activeLabelElement.ariaHidden = "false"
      this.#parkNativeSelection()
    } else {
      this.#activeLabelElement = null
    }

    if (previousLabelElement && previousLabelElement !== this.#activeLabelElement) {
      previousLabelElement.ariaHidden = "true"
      previousLabelElement.firstChild.data = ""
    }
  }

  #parkNativeSelection() {
    const textNode = this.#activeLabelElement.firstChild
    if (textNode && this.#isEditorFocused && !this.#isSelectionParked) {
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

  get #isSelectionParked() {
    const selection = window.getSelection()
    if (selection?.rangeCount === 1) {
      const textNode = this.#activeLabelElement.firstChild
      return selection.anchorNode === textNode
        && selection.focusNode === textNode
        && selection.anchorOffset === 0
        && selection.focusOffset === textNode.length
    } else {
      return false
    }
  }
}
