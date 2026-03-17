import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $setSelection,
  $splitNode,
  COMMAND_PRIORITY_HIGH,
  DRAGSTART_COMMAND,
  DROP_COMMAND
} from "lexical"

import { $isListItemNode, $isListNode } from "@lexical/list"
import { $isActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { $findOrCreateGalleryForImage } from "../nodes/image_gallery_node"

const MIME_TYPE = "application/x-lexxy-node-key"

export class AttachmentDragAndDrop {
  #editor
  #draggedNodeKey = null
  #rafId = null
  #draggingRafId = null
  #cleanupFns = []

  constructor(editor) {
    this.#editor = editor

    // Register Lexical commands at HIGH priority to intercept before the
    // base @lexical/rich-text handlers (which return true and consume the events).
    this.#cleanupFns.push(
      editor.registerCommand(DRAGSTART_COMMAND, (event) => this.#handleDragStart(event), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(DROP_COMMAND, (event) => this.#handleDrop(event), COMMAND_PRIORITY_HIGH),
    )

    // Use a root listener to register DOM-level dragover/dragend handlers
    // (these events need throttled rAF handling that works better as DOM listeners).
    const unregister = editor.registerRootListener((root, prevRoot) => {
      if (prevRoot) {
        prevRoot.removeEventListener("dragover", this.#onDragOver)
        prevRoot.removeEventListener("dragend", this.#onDragEnd)
      }
      if (root) {
        root.addEventListener("dragover", this.#onDragOver)
        root.addEventListener("dragend", this.#onDragEnd)
      }
    })
    this.#cleanupFns.push(unregister)
  }

  destroy() {
    this.#cleanup()
    for (const fn of this.#cleanupFns) fn()
    this.#cleanupFns = []
  }

  // -- Event handlers --------------------------------------------------------

  #handleDragStart(event) {
    if (event.target.closest("textarea")) return false

    const figure = event.target.closest("figure.attachment[data-lexical-node-key]")
    if (!figure) return false

    this.#draggedNodeKey = figure.dataset.lexicalNodeKey
    event.dataTransfer.setData(MIME_TYPE, this.#draggedNodeKey)
    event.dataTransfer.effectAllowed = "move"

    // Add dragging class after a tick so it doesn't affect the drag image
    this.#draggingRafId = requestAnimationFrame(() => {
      this.#draggingRafId = null
      figure.classList.add("lexxy-dragging")
    })

    return true
  }

  #onDragOver = (event) => {
    if (!this.#draggedNodeKey) return

    event.preventDefault()
    event.dataTransfer.dropEffect = "move"

    if (!this.#rafId) {
      this.#rafId = requestAnimationFrame(() => {
        this.#rafId = null
        this.#updateDropTarget(event)
      })
    }
  }

  #handleDrop(event) {
    if (!this.#draggedNodeKey) return false

    event.preventDefault()

    const target = this.#resolveDropTarget(event)
    const draggedKey = this.#draggedNodeKey
    this.#cleanup()

    if (target) {
      this.#performDrop(draggedKey, target)
    }
    return true
  }

  #onDragEnd = () => {
    this.#cleanup()
  }

  // -- Drop target resolution -----------------------------------------------

  #updateDropTarget(event) {
    this.#clearDropIndicators()

    const target = this.#resolveDropTarget(event)
    if (!target) return

    if (target.type === "gallery" || target.type === "gallery-reorder") {
      target.element.classList.add(`lexxy-drop-target--gallery-${target.position}`)
    } else if (target.type === "list-item") {
      target.element.classList.add(`lexxy-drop-target--list-${target.position}`)
    } else {
      target.element.classList.add(`lexxy-drop-target--block-${target.position}`)
    }
  }

  #resolveDropTarget(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY)
    if (!element) return null

    const rootElement = this.#editor.getRootElement()
    if (!rootElement || !rootElement.contains(element)) return null

    // Check if hovering over a previewable image (for gallery merge or reorder)
    const targetFigure = element.closest("figure.attachment--preview[data-lexical-node-key]")
    if (targetFigure && targetFigure.dataset.lexicalNodeKey !== this.#draggedNodeKey) {
      const targetGallery = targetFigure.closest(".attachment-gallery")
      if (targetGallery) {
        // If the dragged image is in the same gallery, this is a reorder
        const draggedFigure = rootElement.querySelector(`[data-lexical-node-key="${this.#draggedNodeKey}"]`)
        if (draggedFigure && targetGallery.contains(draggedFigure)) {
          const position = this.#computeHorizontalPosition(targetFigure, event.clientX)
          return { type: "gallery-reorder", element: targetFigure, nodeKey: targetFigure.dataset.lexicalNodeKey, position }
        }
      }
      const position = this.#computeHorizontalPosition(targetFigure, event.clientX)
      return { type: "gallery", element: targetFigure, nodeKey: targetFigure.dataset.lexicalNodeKey, position }
    }

    // Hovering over the dragged image itself inside a gallery — treat as no-op
    // to prevent fallthrough to the block handler, which would eject it from the gallery.
    if (targetFigure && targetFigure.closest(".attachment-gallery")) return null

    // Check if hovering over a gallery's empty space (for reorder within gallery)
    const targetGallery = element.closest(".attachment-gallery")
    if (targetGallery) {
      let galleryFigure = element.closest("figure.attachment[data-lexical-node-key]")
      if (!galleryFigure) {
        galleryFigure = this.#findNearestFigureInGallery(targetGallery, event.clientX)
      }
      if (galleryFigure && galleryFigure.dataset.lexicalNodeKey !== this.#draggedNodeKey) {
        const position = this.#computeHorizontalPosition(galleryFigure, event.clientX)
        return { type: "gallery-reorder", element: galleryFigure, nodeKey: galleryFigure.dataset.lexicalNodeKey, position }
      }
      // Nearest figure is the dragged image — no-op to avoid block handler fallthrough
      if (galleryFigure) return null
    }

    // Check if hovering over a list item (for list splitting)
    const listItem = element.closest("li")
    if (listItem && rootElement.contains(listItem)) {
      const position = this.#computeVerticalPosition(listItem, event.clientY)
      return { type: "list-item", element: listItem, position }
    }

    // Otherwise, find nearest block-level element for between-block insertion.
    // Normalize so each gap has exactly one indicator: prefer "after" on the
    // previous sibling, falling back to "before" only for the first block.
    const block = this.#findNearestBlock(element, rootElement, event.clientY)
    if (!block) return null

    const position = this.#computeVerticalPosition(block, event.clientY)
    if (position === "before" && block.previousElementSibling) {
      return { type: "block", element: block.previousElementSibling, position: "after" }
    }
    return { type: "block", element: block, position }
  }

  #findNearestBlock(element, rootElement, clientY) {
    let current = element
    while (current && current !== rootElement) {
      if (current.parentElement === rootElement) return current
      current = current.parentElement
    }

    // elementFromPoint landed on the root itself (e.g. a margin gap between
    // blocks). Fall back to the nearest child by vertical distance.
    let nearest = null
    let minDistance = Infinity
    for (const child of rootElement.children) {
      const rect = child.getBoundingClientRect()
      const distance = Math.min(Math.abs(clientY - rect.top), Math.abs(clientY - rect.bottom))
      if (distance < minDistance) {
        minDistance = distance
        nearest = child
      }
    }
    return nearest
  }

  #computeVerticalPosition(element, clientY) {
    const rect = element.getBoundingClientRect()
    return clientY < rect.top + rect.height / 2 ? "before" : "after"
  }

  #computeHorizontalPosition(element, clientX) {
    const rect = element.getBoundingClientRect()
    return clientX < rect.left + rect.width / 2 ? "before" : "after"
  }

  #findNearestFigureInGallery(gallery, clientX) {
    const figures = gallery.querySelectorAll("figure.attachment[data-lexical-node-key]")
    let nearest = null
    let minDistance = Infinity
    for (const figure of figures) {
      const rect = figure.getBoundingClientRect()
      const center = rect.left + rect.width / 2
      const distance = Math.abs(clientX - center)
      if (distance < minDistance) {
        minDistance = distance
        nearest = figure
      }
    }
    return nearest
  }

  // -- Drop indicator --------------------------------------------------------

  static #DROP_CLASSES = [
    "lexxy-drop-target--gallery-before", "lexxy-drop-target--gallery-after",
    "lexxy-drop-target--list-before", "lexxy-drop-target--list-after",
    "lexxy-drop-target--block-before", "lexxy-drop-target--block-after",
  ]

  #clearDropIndicators() {
    const rootElement = this.#editor.getRootElement()
    if (!rootElement) return

    for (const el of rootElement.querySelectorAll("[class*='lexxy-drop-target--']")) {
      el.classList.remove(...AttachmentDragAndDrop.#DROP_CLASSES)
    }
  }

  // -- Node operations -------------------------------------------------------

  #performDrop(draggedKey, target) {
    const draggedNode = $getNodeByKey(draggedKey)
    if (!draggedNode || !$isActionTextAttachmentNode(draggedNode)) return

    if (target.type === "gallery") {
      this.#dropOntoImage(draggedNode, target.nodeKey, target.position)
    } else if (target.type === "gallery-reorder") {
      this.#reorderInGallery(draggedNode, target.nodeKey, target.position)
    } else if (target.type === "list-item") {
      this.#dropIntoList(draggedNode, target)
    } else {
      this.#dropBetweenBlocks(draggedNode, target)
    }

    // Clear selection to prevent a second history entry. Lexical dispatches
    // SELECTION_CHANGE_COMMAND during commit for non-range selections, which
    // creates a separate update. Null selection avoids that dispatch entirely
    // and also prevents Firefox's follow-up selectionchange from dirtying nodes.
    $setSelection(null)
  }

  #dropOntoImage(draggedNode, targetKey, position) {
    const targetNode = $getNodeByKey(targetKey)
    if (!targetNode || !$isActionTextAttachmentNode(targetNode)) return
    if (draggedNode.is(targetNode)) return

    draggedNode.remove()

    const gallery = $findOrCreateGalleryForImage(targetNode)
    if (gallery) {
      if (position === "before") {
        targetNode.insertBefore(draggedNode)
      } else {
        targetNode.insertAfter(draggedNode)
      }
    }
  }

  #reorderInGallery(draggedNode, targetKey, position) {
    const targetNode = $getNodeByKey(targetKey)
    if (!targetNode || draggedNode.is(targetNode)) return

    draggedNode.remove()

    if (position === "before") {
      targetNode.insertBefore(draggedNode)
    } else {
      targetNode.insertAfter(draggedNode)
    }
  }

  #dropIntoList(draggedNode, target) {
    const listItemNode = $getNearestNodeFromDOMNode(target.element)
    if (!listItemNode || !$isListItemNode(listItemNode)) return

    const listNode = listItemNode.getParent()
    if (!listNode || !$isListNode(listNode)) return

    const children = listNode.getChildren()
    const index = children.indexOf(listItemNode)
    if (index === -1) return

    const splitIndex = target.position === "before" ? index : index + 1

    draggedNode.remove()

    if (splitIndex === 0) {
      listNode.insertBefore(draggedNode)
    } else if (splitIndex >= children.length) {
      listNode.insertAfter(draggedNode)
    } else {
      const [ , listAfter ] = $splitNode(listNode, splitIndex)
      listAfter.insertBefore(draggedNode)
    }
  }

  #dropBetweenBlocks(draggedNode, target) {
    const targetNode = $getNearestNodeFromDOMNode(target.element)
    if (!targetNode) return

    const topLevelTarget = targetNode.getTopLevelElement?.() || targetNode
    if (draggedNode.is(topLevelTarget)) return

    draggedNode.remove()

    if (target.position === "before") {
      topLevelTarget.insertBefore(draggedNode)
    } else {
      topLevelTarget.insertAfter(draggedNode)
    }
  }

  // -- Lifecycle helpers -----------------------------------------------------

  #cleanup() {
    this.#clearDropIndicators()

    if (this.#draggedNodeKey) {
      const rootElement = this.#editor.getRootElement()
      if (rootElement) {
        const figure = rootElement.querySelector(`[data-lexical-node-key="${this.#draggedNodeKey}"]`)
        figure?.classList.remove("lexxy-dragging")
      }
    }

    this.#draggedNodeKey = null

    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId)
      this.#rafId = null
    }

    if (this.#draggingRafId) {
      cancelAnimationFrame(this.#draggingRafId)
      this.#draggingRafId = null
    }
  }
}
