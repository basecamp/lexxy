import { $getNodeByKey, $setSelection, COMMAND_PRIORITY_HIGH, KEY_DOWN_COMMAND, SKIP_DOM_SELECTION_TAG } from "lexical"

import { $createNodeSelectionWith, $selectedLabelledDecoratorNode, $singleSelectedNode } from "../helpers/lexical_helper"
import { $isImageGalleryNode } from "../nodes/image_gallery_node"
import AlternativeTextDialog from "../editor/attachments/alternative_text_dialog"
import { createElement, isActiveAndVisible } from "../helpers/html_helper"
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
  #boundNodeKey
  #controls
  #controlsContainer
  #buttonGroup
  #selected = false
  #reflowObserver = new ResizeObserver(() => this.#updatePosition())
  #presentationObserver = new MutationObserver(() => this.#refresh())
  #observedElement = null

  connectedCallback() {
    this.classList.add("lexxy-floating-controls")
    if (!this.#controls) {
      this.role = "toolbar"
    }
    this.hidden = !this.#controls
    this.toggleAttribute("data-custom-controls", Boolean(this.#controls))

    if (this.#editor) {
      this.#setUpButtons()
      this.#monitorSelection()
      this.#followScrolling()
      this.#registerKeyboardShortcut()
      if (this.#controls) {
        this.refresh()
        this.#reflowObserver.observe(this.#editorElement)
        this.#reflowObserver.observe(this.#editor.getElementByKey(this.#boundNodeKey))
        for (const { anchor } of this.#controls.placements || []) this.#reflowObserver.observe(anchor)
      }
    }
  }

  bind({ nodeKey, controls }) {
    this.#boundNodeKey = nodeKey
    this.#currentNodeKey = nodeKey
    this.#controls = controls
  }

  refresh() {
    this.#refreshButtons()
    this.#refresh()
  }

  disconnectedCallback() {
    this.dispose()
  }

  dispose() {
    this.#listeners.dispose()
    this.#reflowObserver.disconnect()
    this.#presentationObserver.disconnect()
    this.#alternativeTextDialog?.dispose()
    this.#controls?.dispose?.()
    this.#controls = null
  }

  get #editor() {
    return this.#editorElement?.editor
  }

  get #editorElement() {
    return this.closest("lexxy-editor")
  }

  #setUpButtons() {
    this.innerHTML = ""

    if (this.#controls) {
      this.#controlsContainer = createElement("div", { className: "lexxy-attachment-controls" })
      this.#controlsContainer.append(this.#controls.element)
      this.append(this.#controlsContainer)
    }

    const container = createElement("div", { className: "lexxy-floating-controls__group" })
    this.#buttonGroup = container
    container.hidden = Boolean(this.#controls)
    container.appendChild(this.#createAlternativeTextButton())
    container.appendChild(this.#createRemoveButton())
    this.#alternativeTextDialog = new AlternativeTextDialog(this.#editorElement)
    this.appendChild(container)

    this.#refreshButtons()
    this.#listeners.track(
      registerEventListener(this, "keydown", this.#navigateOrExit),
      registerEventListener(this, "click", () => this.#selectBoundNode()),
      registerEventListener(this, "focusout", this.#resetTabIndexOnExit),
      registerEventListener(this, "focusin", event => {
        this.#revealControl(event.target)
        this.#selectBoundNode()
      })
    )
  }

  #refreshButtons() {
    this.#buttons = Array.from(this.querySelectorAll("button"))
    const useToolbarNavigation = !this.#controls || this.#editor.read(() => typeof $getNodeByKey(this.#boundNodeKey)?.label === "string")
    for (const button of this.#buttons) {
      if ((useToolbarNavigation || this.#buttonGroup.contains(button)) && button !== document.activeElement) button.tabIndex = -1
    }
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

  #removeSelectedNode() {
    if (this.#hasSelectedNode) {
      this.#editor.update(() => $getNodeByKey(this.#currentNodeKey)?.remove())
      this.#editor.focus()
    }
  }

  get #hasSelectedNode() {
    return this.#selected
  }

  #selectBoundNode() {
    if (this.#boundNodeKey && !this.#selected) {
      this.#editor.update(() => {
        const node = $getNodeByKey(this.#boundNodeKey)
        if (typeof node?.label === "string" && !$singleSelectedNode()?.is(node)) $setSelection($createNodeSelectionWith(node))
      }, { tag: SKIP_DOM_SELECTION_TAG })
    }
  }

  #createAlternativeTextButton() {
    this.#alternativeTextButton = createElement("button", {
      type: "button",
      className: "lexxy-attachment-toolbar__alternative-text",
      ariaLabel: "Alt text",
      title: "Alt text",
      ariaHasPopup: "dialog",
      tabIndex: -1
    })
    this.#alternativeTextButton.appendChild(createElement("span", null, "ALT"))
    this.#listeners.track(registerEventListener(this.#alternativeTextButton, "click", () => {
      this.#alternativeTextDialog.open(this.#currentNodeKey)
    }))
    return this.#alternativeTextButton
  }

  #navigateOrExit = (event) => {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      this.#returnFocusToEditor()
    } else if (event.key === "Tab" && this.role === "toolbar") {
      if (event.shiftKey) {
        event.preventDefault()
        this.#returnFocusToEditor()
      } else if (this.#editorElement.captionEditor.open(this.#currentNodeKey)) {
        event.preventDefault()
      }
    } else if (this.role === "toolbar") {
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
      this.#refreshButtons()
    }
  }

  #monitorSelection() {
    this.#listeners.track(
      this.#editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
        this.#updateForSelection(editorState.read($selectedLabelledDecoratorNode), {
          contentChanged: dirtyElements.size > 0 || dirtyLeaves.size > 0
        })
      })
    )
  }

  #updateForSelection(target, { contentChanged }) {
    if (this.#boundNodeKey) {
      if (target?.key === this.#boundNodeKey) {
        if (this.#selected) {
          if (contentChanged) this.#updatePosition()
        } else {
          this.#show(this.#boundNodeKey)
        }
      } else if (this.#selected) {
        this.#hide()
      } else if (contentChanged) {
        this.#updatePosition()
      }
    } else if (target && !this.#editorElement.attachmentControls.elementFor(target.key)) {
      this.#show(target.key)
    } else {
      this.#hide()
    }
  }

  #show(nodeKey) {
    this.#currentNodeKey = nodeKey
    this.#selected = true
    this.role = "toolbar"
    this.toggleAttribute("data-selected", true)
    this.#buttonGroup.hidden = false
    this.#refresh()
    this.hidden = false
    this.#reflowObserver.observe(this.#editorElement)
  }

  #refresh() {
    if (this.#currentNodeKey) {
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
    return this.#editorElement.dataset.actionTextSupportsAlt !== "false"
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
      // We are positioned against the editor's padding box, but the rect measures its border box.
      const borderTop = this.#editorElement.clientTop
      const borderLeft = this.#editorElement.clientLeft
      this.style.setProperty("--lexxy-anchor-top", `${rect.top - editorRect.top - borderTop}px`)
      this.style.setProperty("--lexxy-anchor-left", `${rect.left - editorRect.left - borderLeft}px`)
      this.style.setProperty("--lexxy-anchor-width", `${rect.width}px`)
      this.style.setProperty("--lexxy-anchor-height", `${rect.height}px`)
      if (this.#controls) {
        const anchorStyle = getComputedStyle(figureElement)
        this.#controlsContainer.style.overflow = anchorStyle.overflow
        this.#controlsContainer.style.borderRadius = anchorStyle.borderRadius
        for (const placement of this.#controls.placements || []) this.#positionControl(placement)
        this.#clipToScrollport(figureElement)
      }
      this.#flipWhenOverflowing(editorRect)
    }
  }

  #positionControl({ element, anchor }) {
    element.style.boxSizing = "border-box"
    element.style.position = "absolute"
    const container = element.offsetParent
    // Hidden editors have no containing block until they are displayed again.
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const rect = anchor.getBoundingClientRect()
    element.style.left = `${rect.left - containerRect.left - container.clientLeft + container.scrollLeft}px`
    element.style.top = `${rect.top - containerRect.top - container.clientTop + container.scrollTop}px`
    element.style.width = `${rect.width}px`
    element.style.height = `${rect.height}px`
  }

  #clipToScrollport(figureElement) {
    const rect = this.getBoundingClientRect()
    const clip = { top: 0, right: 0, bottom: 0, left: 0 }

    for (let ancestor = figureElement.parentElement; ancestor !== this.#editorElement; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      const bounds = ancestor.getBoundingClientRect()
      if (style.overflowY !== "visible") {
        clip.top = Math.max(clip.top, bounds.top + ancestor.clientTop - rect.top)
        clip.bottom = Math.max(clip.bottom, rect.bottom - bounds.top - ancestor.clientTop - ancestor.clientHeight)
      }
      if (style.overflowX !== "visible") {
        clip.left = Math.max(clip.left, bounds.left + ancestor.clientLeft - rect.left)
        clip.right = Math.max(clip.right, rect.right - bounds.left - ancestor.clientLeft - ancestor.clientWidth)
      }
    }

    this.style.clipPath = Object.values(clip).some(value => value > 0)
      ? `inset(${clip.top}px ${clip.right}px ${clip.bottom}px ${clip.left}px)` : "none"
  }

  #revealControl(element) {
    if (this.#controls) {
      const placement = this.#controls.placements?.find(placement => placement.element.contains(element))
      const anchor = placement?.anchor || this.#editor.getElementByKey(this.#boundNodeKey)
      anchor.scrollIntoView({ block: "nearest", inline: "nearest" })
      this.#updatePosition()
    }
  }

  #flipWhenOverflowing(editorRect) {
    this.removeAttribute("data-overflow")
    if (this.getBoundingClientRect().right > editorRect.right) {
      this.setAttribute("data-overflow", "")
    }
  }

  #hide() {
    this.#selected = false
    this.toggleAttribute("data-selected", false)
    this.#buttonGroup.hidden = true
    if (this.#boundNodeKey) {
      this.removeAttribute("role")
      this.#refresh()
    } else {
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
    ), registerEventListener(this.#editorElement, "keydown", event => {
      if (!this.#editor.isEditable() && event.target === this.#editor.getRootElement()) {
        if (this.#focusToolbarOnAltF10(event)) {
          event.stopPropagation()
        } else if (this.#hasSelectedNode && event.key === "Tab" && !event.shiftKey && this.#editorElement.captionEditor.open(this.#currentNodeKey)) {
          event.preventDefault()
        }
      }
    }))
  }

  #focusToolbarOnAltF10 = (event) => {
    if (this.#hasSelectedNode && event.altKey && event.key === "F10") {
      event.preventDefault()
      const button = this.#buttons.find(isActiveAndVisible)
      if (button) {
        this.#revealControl(button)
        button.focus({ preventScroll: true })
      }
      return true
    } else {
      return false
    }
  }
}

export default AttachmentToolbar
