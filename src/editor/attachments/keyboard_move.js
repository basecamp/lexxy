import { $setSelection, COMMAND_PRIORITY_HIGH, KEY_DOWN_COMMAND } from "lexical"

import { $isActionTextAttachmentNode } from "../../nodes/action_text_attachment_node"
import { $findOrCreateGalleryForImage, $isImageGalleryNode, ImageGalleryNode } from "../../nodes/image_gallery_node"
import { $isProvisionalParagraphNode } from "../../nodes/provisional_paragraph_node"
import { Direction } from "../../helpers/direction"
import { $createNodeSelectionWith, $singleSelectedNode, announceFromEditor } from "../../helpers/lexical_helper"
import { ListenerBin } from "../../helpers/listener_helper"

export class AttachmentKeyboardMove {
  #editor
  #listeners = new ListenerBin()

  constructor(editor) {
    this.#editor = editor

    this.#listeners.track(
      editor.registerCommand(KEY_DOWN_COMMAND, this.#tryReorder, COMMAND_PRIORITY_HIGH)
    )
  }

  destroy() {
    this.#listeners.dispose()
  }

  #tryReorder = (event) => {
    if (event.altKey && event.shiftKey && event.key.startsWith("Arrow")) {
      const node = $singleSelectedNode()
      if ($isActionTextAttachmentNode(node)) {
        event.preventDefault()
        const message = this.#executeMove(event.key, node) || this.#blockedMessageFor(event.key)
        $setSelection($createNodeSelectionWith(node))
        announceFromEditor(this.#editor, message)
        return true
      }
    }
    return false
  }

  #executeMove(key, node) {
    switch (key) {
      case "ArrowUp": return new AttachmentReorder(node, Direction.backward).moveVertically()
      case "ArrowDown": return new AttachmentReorder(node, Direction.forward).moveVertically()
      case "ArrowLeft": return new AttachmentReorder(node, Direction.backward).reorderInGallery()
      case "ArrowRight": return new AttachmentReorder(node, Direction.forward).reorderInGallery()
      default: return null
    }
  }

  #blockedMessageFor(key) {
    switch (key) {
      case "ArrowUp":
      case "ArrowLeft":
        return "Already at the start"
      case "ArrowDown":
      case "ArrowRight":
        return "Already at the end"
      default:
        return null
    }
  }
}

class AttachmentReorder {
  constructor(node, direction) {
    this.node = node
    this.direction = direction
  }

  moveVertically() {
    if ($isImageGalleryNode(this.node.getParent())) {
      return this.#extractFromGallery()
    } else {
      return this.#moveBlock()
    }
  }

  reorderInGallery() {
    if ($isImageGalleryNode(this.node.getParent())) {
      const sibling = this.direction.siblingOf(this.node)
      if (sibling) {
        this.direction.insertNextTo(sibling, this.node)
        return "Image reordered in gallery"
      }
    }
    return null
  }

  #extractFromGallery() {
    const gallery = this.node.getParent()
    this.node.remove()
    this.direction.insertNextTo(gallery, this.node)
    return "Image removed from gallery"
  }

  #moveBlock() {
    const sibling = this.direction.siblingOf(this.node)
    if (sibling) {
      const target = this.#skipProvisional(sibling)
      if (this.#canJoinGallery(target)) {
        return this.#joinGallery(target)
      } else if (this.#canFormGalleryWith(target)) {
        return this.#formGalleryWith(target)
      } else {
        return this.#swapWith(sibling)
      }
    } else {
      return null
    }
  }

  #skipProvisional(node) {
    let current = node
    while (current && $isProvisionalParagraphNode(current)) {
      current = this.direction.siblingOf(current)
    }
    return current
  }

  #canJoinGallery(target) {
    return $isImageGalleryNode(target) && ImageGalleryNode.isValidChild(this.node)
  }

  #joinGallery(gallery) {
    this.node.remove()
    if (this.direction.isForward && gallery.getFirstChild()) {
      gallery.getFirstChild().insertBefore(this.node)
    } else {
      gallery.append(this.node)
    }
    return "Image added to gallery"
  }

  #canFormGalleryWith(sibling) {
    return $isActionTextAttachmentNode(sibling)
      && sibling.isPreviewableImage
      && this.node.isPreviewableImage
  }

  #formGalleryWith(sibling) {
    this.node.remove()
    if ($findOrCreateGalleryForImage(sibling)) {
      if (this.direction.isForward) {
        sibling.insertBefore(this.node)
      } else {
        sibling.insertAfter(this.node)
      }
      return "Gallery created"
    } else {
      return null
    }
  }

  #swapWith(sibling) {
    this.node.remove()
    this.direction.insertNextTo(sibling, this.node)
    return this.direction.isForward ? "Attachment moved down" : "Attachment moved up"
  }
}
