import { $getNodeByKey, $setSelection, HISTORY_MERGE_TAG, SKIP_DOM_SELECTION_TAG } from "lexical"
import { $isImageGalleryNode } from "../../nodes/image_gallery_node"
import { $createNodeSelectionWith } from "../../helpers/lexical_helper"
import { createElement } from "../../helpers/html_helper"
import { ListenerBin, registerEventListener } from "../../helpers/listener_helper"

export default class CaptionEditor {
  #editorElement
  #editor
  #input = createElement("textarea", { className: "lexxy-caption-editor", hidden: true, tabIndex: -1, rows: 1, placeholder: "Add caption..." })
  #nodeKey
  #caption
  #listeners = new ListenerBin()
  #resizeObserver = new ResizeObserver(() => this.#updatePosition())

  constructor(editorElement) {
    this.#editorElement = editorElement
    this.#editor = editorElement.editor
    editorElement.append(this.#input)
    this.#listeners.track(
      registerEventListener(this.#input, "blur", () => this.#save()),
      registerEventListener(this.#input, "keydown", event => this.#handleKeydown(event)),
      registerEventListener(this.#input, "input", () => this.#updatePosition()),
      registerEventListener(editorElement, "scroll", () => this.#updatePosition(), { capture: true, passive: true }),
      this.#editor.registerUpdateListener(() => this.#checkAttachment())
    )
  }

  dispose() {
    this.#listeners.dispose()
    this.#close()
    this.#input.remove()
  }

  open(nodeKey) {
    const caption = this.#editor.getElementByKey(nodeKey)?.querySelector("figcaption.attachment__caption--editable")
    if (caption) {
      if (this.#nodeKey !== nodeKey) {
        this.#edit(nodeKey, caption)
      }
      return true
    } else {
      return false
    }
  }

  #save() {
    if (this.#nodeKey) {
      const key = this.#nodeKey
      const value = this.#input.value
      this.#close()
      this.#editor.update(() => {
        const node = $getNodeByKey(key)
        if (node && node.caption !== value) node.getWritable().caption = value
      }, { tag: SKIP_DOM_SELECTION_TAG, discrete: true })
    }
  }

  #close() {
    this.#nodeKey = null
    this.#resizeObserver.disconnect()
    if (this.#caption) {
      this.#caption.classList.remove("attachment__caption--editing")
      this.#caption.style.removeProperty("min-height")
      this.#caption = null
    }
    this.#input.hidden = true
  }

  #handleKeydown(event) {
    if (!event.isComposing && [ "Enter", "Escape" ].includes(event.key)) {
      event.preventDefault()
      const key = this.#nodeKey
      this.#input.blur()
      this.#editor.getRootElement()?.focus({ preventScroll: true })
      this.#editor.update(() => {
        const node = $getNodeByKey(key)
        if (node) {
          if (event.key === "Enter") {
            if ($isImageGalleryNode(node.getParent()) && !node.getNextSibling()) {
              node.getParent().selectNext(0, 0)
            } else {
              node.selectNext(0, 0)
            }
          } else {
            $setSelection($createNodeSelectionWith(node))
          }
        }
      }, { tag: HISTORY_MERGE_TAG })
    }
    event.stopPropagation()
  }

  #updatePosition() {
    if (this.#caption?.isConnected) {
      const rect = this.#caption.getBoundingClientRect()
      const editorRect = this.#editorElement.getBoundingClientRect()
      this.#input.style.left = `${rect.left - editorRect.left - this.#editorElement.clientLeft + this.#editorElement.scrollLeft}px`
      this.#input.style.top = `${rect.top - editorRect.top - this.#editorElement.clientTop + this.#editorElement.scrollTop}px`
      this.#input.style.width = `${rect.width}px`
      this.#input.style.height = "0px"
      const height = this.#input.scrollHeight
      this.#input.style.height = `${height}px`
      this.#caption.style.minHeight = `${height}px`
    }
  }

  #checkAttachment() {
    if (this.#nodeKey && this.#editor.getElementByKey(this.#nodeKey)?.querySelector("figcaption") !== this.#caption) {
      this.#close()
    } else {
      this.#updatePosition()
    }
  }

  #edit(nodeKey, caption) {
    this.#save()
    this.#nodeKey = nodeKey
    this.#caption = caption
    this.#editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey)
      this.#input.value = node.caption
      if (node.isVideo) {
        this.#input.ariaLabel = "Video caption"
      } else {
        this.#input.ariaLabel = "Image caption"
      }
    })

    caption.scrollIntoView({ block: "nearest", inline: "nearest" })
    const style = getComputedStyle(caption)
    this.#input.style.font = style.font
    this.#input.style.padding = style.padding
    this.#input.style.color = style.color
    this.#input.style.textAlign = getComputedStyle(caption.firstElementChild).textAlign
    this.#input.hidden = false
    caption.classList.add("attachment__caption--editing")
    this.#resizeObserver.observe(caption)
    this.#resizeObserver.observe(this.#editorElement)
    this.#updatePosition()
    this.#input.focus({ preventScroll: true })
  }
}
