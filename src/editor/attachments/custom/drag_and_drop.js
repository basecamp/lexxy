import {
  $createRangeSelectionFromDom,
  $getNodeByKey,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  DRAGSTART_COMMAND,
  DROP_COMMAND
} from "lexical"

import { $isCustomActionTextAttachmentNode } from "../../../nodes/custom_action_text_attachment_node"
import { caretFromPoint, caretRect } from "../../../helpers/caret_helpers"
import { createElement } from "../../../helpers/html_helper"
import { ListenerBin } from "../../../helpers/listener_helper"

const MIME_TYPE = "application/x-lexxy-custom-attachment-key"

// Custom inline attachments reorder by dropping at a text caret, unlike block
// attachments which insert between blocks or into galleries.
export class CustomAttachmentDragAndDrop {
  #editor
  #draggedNodeKey = null
  #draggingRafId = null
  #dragOverRafId = null
  #dropIndicator = null
  #listeners = new ListenerBin()

  constructor(editor) {
    this.#editor = editor

    // Register at HIGH priority to intercept before the base @lexical/rich-text
    // handlers, which consume drag events. The block-attachment handler also
    // registers here but bails for inline custom attachments, so we get our turn.
    this.#listeners.track(
      editor.registerCommand(DRAGSTART_COMMAND, (event) => this.#handleDragStart(event), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(DROP_COMMAND, (event) => this.#handleDrop(event), COMMAND_PRIORITY_HIGH)
    )

    this.#listeners.track(editor.registerRootListener((root, prevRoot) => {
      if (prevRoot) {
        prevRoot.removeEventListener("dragover", this.#onDragOver)
        prevRoot.removeEventListener("dragend", this.#onDragEnd)
      }
      if (root) {
        root.addEventListener("dragover", this.#onDragOver)
        root.addEventListener("dragend", this.#onDragEnd)
      }
    }))
  }

  destroy() {
    this.#cleanup()
    this.#dropIndicator?.remove()
    this.#dropIndicator = null
    this.#listeners.dispose()
  }

  #handleDragStart(event) {
    const attachment = this.#customAttachmentElementFrom(event.target)
    if (!attachment) return false

    this.#draggedNodeKey = attachment.dataset.lexicalNodeKey
    event.dataTransfer.setData(MIME_TYPE, this.#draggedNodeKey)
    event.dataTransfer.effectAllowed = "move"

    this.#draggingRafId = requestAnimationFrame(() => {
      this.#draggingRafId = null
      attachment.classList.add("lexxy-dragging")
    })

    return true
  }

  #onDragOver = (event) => {
    if (!this.#draggedNodeKey) return

    event.preventDefault()
    event.dataTransfer.dropEffect = "move"

    if (!this.#dragOverRafId) {
      this.#dragOverRafId = requestAnimationFrame(() => {
        this.#dragOverRafId = null
        this.#updateDropIndicator(event)
      })
    }
  }

  #onDragEnd = () => {
    this.#cleanup()
  }

  #handleDrop(event) {
    if (!this.#draggedNodeKey) return false

    event.preventDefault()

    const dropPoint = this.#resolveDropPoint(event)
    const draggedKey = this.#draggedNodeKey
    this.#cleanup()

    if (dropPoint) {
      this.#moveAttachment(draggedKey, dropPoint)
    }

    return true
  }

  #resolveDropPoint(event) {
    const rootElement = this.#editor.getRootElement()
    if (!rootElement) return null

    const caret = caretFromPoint(event.clientX, event.clientY)
    if (!caret || !rootElement.contains(caret.node)) return null

    // A caret on the root itself points between blocks. Mentions behave like text:
    // they only drop onto an existing line, so snap to the nearest one.
    if (caret.node === rootElement) {
      return this.#nearestLineCaret(rootElement, event.clientY)
    }

    // When mentions sit next to each other with no text between them, the caret
    // lands inside the neighbouring decorator's DOM. Lexical can't resolve a point
    // inside a decorator to an editable position, and the cursor has no business
    // showing there anyway, so snap to just before or after that mention.
    const decorator = this.#decoratorElementContaining(caret.node)
    if (decorator) {
      return this.#dropPointBesideDecorator(decorator, event.clientX)
    } else {
      return caret
    }
  }

  #nearestLineCaret(rootElement, clientY) {
    let nearestLine = null
    let nearestDistance = Infinity

    for (const line of rootElement.children) {
      const rect = line.getBoundingClientRect()
      const distance = Math.min(Math.abs(clientY - rect.top), Math.abs(clientY - rect.bottom))
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestLine = line
      }
    }

    if (!nearestLine) return null

    const rect = nearestLine.getBoundingClientRect()
    if (clientY < rect.top) {
      return { node: nearestLine, offset: 0 }
    } else {
      return { node: nearestLine, offset: nearestLine.childNodes.length }
    }
  }

  #decoratorElementContaining(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
    return element?.closest("[data-lexxy-decorator][data-lexical-node-key]")
  }

  #dropPointBesideDecorator(decorator, clientX) {
    const rect = decorator.getBoundingClientRect()
    const placement = clientX > rect.left + rect.width / 2 ? "after" : "before"
    return { decoratorKey: decorator.dataset.lexicalNodeKey, placement }
  }

  #moveAttachment(draggedKey, dropPoint) {
    this.#editor.update(() => {
      const draggedNode = $getNodeByKey(draggedKey)
      if (!$isCustomActionTextAttachmentNode(draggedNode)) return

      if (dropPoint.decoratorKey) {
        this.#moveBesideNode(draggedNode, dropPoint)
      } else {
        this.#moveToCaret(draggedNode, dropPoint)
      }
    })
  }

  #moveBesideNode(draggedNode, { decoratorKey, placement }) {
    const targetNode = $getNodeByKey(decoratorKey)
    if (!targetNode || targetNode === draggedNode) return

    draggedNode.remove()
    if (placement === "after") {
      targetNode.insertAfter(draggedNode)
    } else {
      targetNode.insertBefore(draggedNode)
    }
  }

  #moveToCaret(draggedNode, dropPoint) {
    const selection = $createRangeSelectionFromDom({
      anchorNode: dropPoint.node,
      anchorOffset: dropPoint.offset,
      focusNode: dropPoint.node,
      focusOffset: dropPoint.offset
    }, this.#editor)
    if (!selection) return

    $setSelection(selection)

    draggedNode.remove()
    selection.insertNodes([ draggedNode ])
  }

  #updateDropIndicator(event) {
    this.#hideCaret()

    const dropPoint = this.#resolveDropPoint(event)
    if (dropPoint) this.#showCaret(this.#caretRectFor(dropPoint))
  }

  #caretRectFor(dropPoint) {
    if (dropPoint.decoratorKey) {
      return this.#decoratorEdgeRect(dropPoint)
    }

    const { node, offset } = dropPoint
    const rect = caretRect(node, offset)
    if (rect) return rect

    // A blank line has no text to measure, so fall back to the line's own box.
    const line = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
    if (!line) return null

    const lineRect = line.getBoundingClientRect()
    return { left: lineRect.left, top: lineRect.top, height: lineRect.height }
  }

  #decoratorEdgeRect({ decoratorKey, placement }) {
    const decorator = this.#editor.getRootElement()?.querySelector(`[data-lexical-node-key="${decoratorKey}"]`)
    if (!decorator) return null

    const rect = decorator.getBoundingClientRect()
    const left = placement === "after" ? rect.right : rect.left
    return { left, top: rect.top, height: rect.height }
  }

  #showCaret(rect) {
    if (!rect) return

    const caret = this.#ensureCaretIndicator()
    caret.style.blockSize = `${rect.height}px`
    caret.style.insetInlineStart = `${rect.left}px`
    caret.style.insetBlockStart = `${rect.top}px`
  }

  #ensureCaretIndicator() {
    this.#dropIndicator ||= createElement("div", { className: "lexxy-drop-caret" })

    this.#editorElement().appendChild(this.#dropIndicator)
    this.#dropIndicator.style.display = "block"
    return this.#dropIndicator
  }

  #editorElement() {
    return this.#editor.getRootElement().closest("lexxy-editor")
  }

  #hideCaret() {
    if (this.#dropIndicator) this.#dropIndicator.style.display = "none"
  }

  #customAttachmentElementFrom(target) {
    return target?.closest?.("[data-lexxy-decorator][data-lexical-node-key]")
  }

  #cleanup() {
    if (this.#draggedNodeKey) {
      const rootElement = this.#editor.getRootElement()
      const attachment = rootElement?.querySelector(`[data-lexical-node-key="${this.#draggedNodeKey}"]`)
      attachment?.classList.remove("lexxy-dragging")
    }

    this.#hideCaret()
    this.#draggedNodeKey = null

    if (this.#draggingRafId) {
      cancelAnimationFrame(this.#draggingRafId)
      this.#draggingRafId = null
    }

    if (this.#dragOverRafId) {
      cancelAnimationFrame(this.#dragOverRafId)
      this.#dragOverRafId = null
    }
  }
}
