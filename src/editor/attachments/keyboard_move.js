import { $getChildCaret, $getSiblingCaret, $setSelection, COMMAND_PRIORITY_HIGH, KEY_DOWN_COMMAND, flipDirection } from "lexical"

import { $isActionTextAttachmentNode } from "../../nodes/action_text_attachment_node"
import { $findOrCreateGalleryForImage, $isImageGalleryNode, ImageGalleryNode } from "../../nodes/image_gallery_node"
import { $isProvisionalParagraphNode } from "../../nodes/provisional_paragraph_node"
import { $createNodeSelectionWith, $singleSelectedNode, announceFromEditor } from "../../helpers/lexical_helper"
import { ListenerBin } from "../../helpers/listener_helper"

export class AttachmentKeyboardMove {
  #editor
  #listeners = new ListenerBin()
  #scrollFrame

  constructor(editor) {
    this.#editor = editor

    this.#listeners.track(
      editor.registerCommand(KEY_DOWN_COMMAND, this.#tryReorder, COMMAND_PRIORITY_HIGH)
    )
  }

  destroy() {
    this.#listeners.dispose()
    cancelAnimationFrame(this.#scrollFrame)
  }

  #tryReorder = (event) => {
    const node = $singleSelectedNode()
    if (event.altKey && event.shiftKey && event.key.startsWith("Arrow") && $isActionTextAttachmentNode(node)) {
      event.preventDefault()
      const message = this.#executeMove(event.key, node)
      $setSelection($createNodeSelectionWith(node))
      announceFromEditor(this.#editor, message)
      this.#keepInView(node)
      return true
    } else {
      return false
    }
  }

  #executeMove(key, node) {
    switch (key) {
      case "ArrowUp": return new AttachmentReorder(node, "previous").moveVertically()
      case "ArrowDown": return new AttachmentReorder(node, "next").moveVertically()
      case "ArrowLeft": return new AttachmentReorder(node, "previous").reorderInGallery()
      case "ArrowRight": return new AttachmentReorder(node, "next").reorderInGallery()
      default: return null
    }
  }

  // Node selections don't scroll into view automatically like a caret does.
  #keepInView(node) {
    const key = node.getKey()
    cancelAnimationFrame(this.#scrollFrame)
    this.#scrollFrame = requestAnimationFrame(() => {
      this.#editor.getElementByKey(key)?.scrollIntoView({ block: "nearest" })
    })
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
      return this.#moveBlock() || this.#blockedMessage
    }
  }

  reorderInGallery() {
    const sibling = $getSiblingCaret(this.node, this.direction).getNodeAtCaret()
    if ($isImageGalleryNode(this.node.getParent()) && sibling) {
      $getSiblingCaret(sibling, this.direction).insert(this.node)
      return "Image reordered in gallery"
    } else {
      return this.#blockedMessage
    }
  }

  #extractFromGallery() {
    const gallery = this.node.getParent()
    $getSiblingCaret(gallery, this.direction).insert(this.node)
    return "Image removed from gallery"
  }

  #moveBlock() {
    const target = this.#skipProvisional($getSiblingCaret(this.node, this.direction).getNodeAtCaret())
    if (this.#canJoinGallery(target)) {
      return this.#joinGallery(target)
    } else if (this.#canFormGalleryWith(target)) {
      return this.#formGalleryWith(target)
    } else if (target) {
      return this.#swapWith(target)
    } else {
      return null
    }
  }

  #skipProvisional(node) {
    let current = node
    while (current && $isProvisionalParagraphNode(current)) {
      current = $getSiblingCaret(current, this.direction).getNodeAtCaret()
    }
    return current
  }

  #canJoinGallery(target) {
    return $isImageGalleryNode(target) && ImageGalleryNode.isValidChild(this.node)
  }

  #joinGallery(gallery) {
    $getChildCaret(gallery, this.direction).insert(this.node)
    return "Image added to gallery"
  }

  #canFormGalleryWith(target) {
    return $isActionTextAttachmentNode(target)
      && target.isPreviewableImage
      && this.node.isPreviewableImage
  }

  #formGalleryWith(target) {
    if ($findOrCreateGalleryForImage(target)) {
      $getSiblingCaret(target, flipDirection(this.direction)).insert(this.node)
      return "Gallery created"
    } else {
      return null
    }
  }

  #swapWith(target) {
    $getSiblingCaret(target, this.direction).insert(this.node)
    if (this.direction === "next") {
      return "Attachment moved down"
    } else {
      return "Attachment moved up"
    }
  }

  get #blockedMessage() {
    if (this.direction === "next") {
      return "Already at the end"
    } else {
      return "Already at the start"
    }
  }
}
