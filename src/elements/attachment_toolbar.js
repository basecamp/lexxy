import { $getNodeByKey, $setSelection, COMMAND_PRIORITY_HIGH, KEY_DOWN_COMMAND } from "lexical"

import { $createNodeSelectionWith, registerLabelledDecoratorSelection } from "../helpers/lexical_helper"
import { $isImageGalleryNode } from "../nodes/image_gallery_node"
import AlternativeTextDialog from "../editor/attachments/alternative_text_dialog"
import { createElement } from "../helpers/html_helper"
import { handleRollingTabIndex } from "../helpers/accessibility_helper"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"

const DELETE_ICON = `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
  <path d="M11.2041 1.01074C12.2128 1.113 13 1.96435 13 3V4H15L15.1025 4.00488C15.6067 4.05621 16 4.48232 16 5C16 5.55228 15.5523 6 15 6H14.8457L14.1416 15.1533C14.0614 16.1953 13.1925 17 12.1475 17H5.85254L5.6582 16.9902C4.76514 16.9041 4.03607 16.2296 3.88184 15.3457L3.8584 15.1533L3.1543 6H3C2.44772 6 2 5.55228 2 5C2 4.44772 2.44772 4 3 4H5V3C5 1.89543 5.89543 1 7 1H11L11.2041 1.01074ZM5.85254 15H12.1475L12.8398 6H5.16016L5.85254 15ZM7 4H11V3H7V4Z"/>
</svg>`

export class AttachmentToolbar extends HTMLElement {
  #listeners = new ListenerBin()
  #buttons = []
  #alternativeTextButton
  #alternativeTextDialog
  #currentNodeKey = null
  #reflowObserver = new ResizeObserver(() => this.#updatePosition())
  #presentationObserver = new MutationObserver(() => this.#refresh())
  #observedElement = null

  connectedCallback() {
    this.classList.add("lexxy-floating-controls")
    this.role = "toolbar"
    this.hidden = true

    if (this.#editor) {
      this.#setUpButtons()
      this.#monitorSelection()
      this.#followScrolling()
      this.#registerKeyboardShortcut()
    }
  }

  disconnectedCallback() {
    this.dispose()
  }

  dispose() {
    this.#listeners.dispose()
    this.#reflowObserver.disconnect()
    this.#presentationObserver.disconnect()
    this.#alternativeTextDialog?.dispose()
  }

  get #editor() {
    return this.#editorElement?.editor
  }

  get #editorElement() {
    return this.closest("lexxy-editor")
  }

  #setUpButtons() {
    this.innerHTML = ""

    const container = createElement("div", { className: "lexxy-floating-controls__group" })
    container.appendChild(this.#createRemoveButton())
    container.appendChild(this.#createAlternativeTextButton())
    this.#alternativeTextDialog = new AlternativeTextDialog(this.#editorElement)
    this.appendChild(container)

    this.#buttons = Array.from(this.querySelectorAll("button"))
    this.#listeners.track(
      registerEventListener(this, "keydown", this.#navigateOrExit),
      registerEventListener(this, "focusout", this.#resetTabIndexOnExit)
    )
  }

  #createRemoveButton() {
    const button = createElement("button", {
      type: "button",
      className: "lexxy-attachment-toolbar__remove",
      ariaLabel: "Remove",
      tabIndex: -1
    })
    button.innerHTML = DELETE_ICON
    this.#listeners.track(registerEventListener(button, "click", () => this.#removeSelectedNode()))
    return button
  }

  #createAlternativeTextButton() {
    this.#alternativeTextButton = createElement("button", {
      type: "button",
      className: "lexxy-attachment-toolbar__alternative-text",
      textContent: "ALT",
      ariaLabel: "Alternative text",
      title: "Alternative text",
      ariaHasPopup: "dialog",
      tabIndex: -1
    })
    this.#listeners.track(registerEventListener(this.#alternativeTextButton, "click", () => {
      this.#alternativeTextDialog.open(this.#currentNodeKey)
    }))
    return this.#alternativeTextButton
  }

  #removeSelectedNode() {
    if (this.#hasSelectedNode) {
      this.#editor.update(() => $getNodeByKey(this.#currentNodeKey)?.remove())
      this.#editor.focus()
    }
  }

  get #hasSelectedNode() {
    return this.#currentNodeKey !== null
  }

  #navigateOrExit = (event) => {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      this.#returnFocusToEditor()
    } else {
      handleRollingTabIndex(this.#buttons, event)
    }
  }

  #returnFocusToEditor() {
    this.#editor.getRootElement()?.focus({ preventScroll: true })
    if (this.#currentNodeKey) {
      const nodeKey = this.#currentNodeKey
      this.#editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node) $setSelection($createNodeSelectionWith(node))
      })
    }
  }

  #resetTabIndexOnExit = (event) => {
    if (!this.contains(event.relatedTarget)) {
      this.#buttons.forEach(button => button.tabIndex = -1)
    }
  }

  #monitorSelection() {
    this.#listeners.track(
      registerLabelledDecoratorSelection(this.#editor, (target) => this.#updateForSelection(target))
    )
  }

  #updateForSelection(target) {
    if (target) {
      this.#show(target.key)
    } else {
      this.#hide()
    }
  }

  #show(nodeKey) {
    this.#currentNodeKey = nodeKey
    this.#refresh()
    this.hidden = false
    this.#reflowObserver.observe(this.#editorElement)
  }

  #refresh() {
    if (this.#hasSelectedNode) {
      this.#watchPresentation(this.#currentNodeKey)
      this.#describeNode(this.#currentNodeKey)
      this.#updatePosition()
    }
  }

  // Failed previews change presentation without a Lexical update, and a node
  // can replace its figure without changing its key.
  #watchPresentation(nodeKey) {
    const element = this.#editor.getElementByKey(nodeKey)
    if (element !== this.#observedElement) {
      this.#presentationObserver.disconnect()
      this.#observedElement = element
      if (element) this.#presentationObserver.observe(element, { attributes: true, attributeFilter: [ "class" ] })
    }
  }

  #describeNode(nodeKey) {
    const element = this.#editor.getElementByKey(nodeKey)

    this.#editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey)
      this.#alternativeTextButton.hidden = !this.#canEditAlternativeText(node)
      this.dataset.nodeType = node.getType()
      this.dataset.presentation = this.#presentationOf(node, element)

      if (node.contentType) {
        this.dataset.contentType = node.contentType
      } else {
        delete this.dataset.contentType
      }
    })
  }

  #canEditAlternativeText(node) {
    return this.#editorElement.config.get("alternativeText")
      && node.getType() === "action_text_attachment"
      && node.isPreviewableAttachment
  }

  #presentationOf(node, element) {
    if ($isImageGalleryNode(node.getParent())) {
      return "gallery"
    } else if (node.isInline() && this.#rendersInline(element)) {
      return "inline"
    } else if (element?.classList.contains("attachment--preview")) {
      return "preview"
    } else {
      return "block"
    }
  }

  #rendersInline(element) {
    return element != null && getComputedStyle(element).display.startsWith("inline")
  }

  #updatePosition() {
    const figureElement = this.#editor.getElementByKey(this.#currentNodeKey)
    if (figureElement) {
      const rect = figureElement.getBoundingClientRect()
      const editorRect = this.#editorElement.getBoundingClientRect()
      this.style.setProperty("--lexxy-anchor-top", `${rect.top - editorRect.top}px`)
      this.style.setProperty("--lexxy-anchor-left", `${rect.left - editorRect.left}px`)
      this.style.setProperty("--lexxy-anchor-width", `${rect.width}px`)
      this.style.setProperty("--lexxy-anchor-height", `${rect.height}px`)
      this.#flipWhenOverflowing(editorRect)
    }
  }

  #flipWhenOverflowing(editorRect) {
    this.removeAttribute("data-overflow")
    if (this.getBoundingClientRect().right > editorRect.right) {
      this.setAttribute("data-overflow", "")
    }
  }

  #hide() {
    if (this.#hasSelectedNode) {
      this.#currentNodeKey = null
      this.hidden = true
      this.#reflowObserver.disconnect()
      this.#presentationObserver.disconnect()
      this.#observedElement = null
    }
  }

  // Scrolling inside the editor moves the figure without resizing anything.
  #followScrolling() {
    this.#listeners.track(registerEventListener(this.#editorElement, "scroll", () => this.#updatePosition(), { capture: true, passive: true }))
  }

  #registerKeyboardShortcut() {
    this.#listeners.track(this.#editor.registerCommand(
      KEY_DOWN_COMMAND,
      this.#focusToolbarOnAltF10,
      COMMAND_PRIORITY_HIGH
    ))
  }

  #focusToolbarOnAltF10 = (event) => {
    if (this.#hasSelectedNode && event.altKey && event.key === "F10") {
      event.preventDefault()
      this.#buttons[0]?.focus()
      return true
    } else {
      return false
    }
  }
}

export default AttachmentToolbar
