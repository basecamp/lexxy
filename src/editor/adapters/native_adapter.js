import { dispatch } from "../../helpers/html_helper"
import { $getNodeByKey, $getSelection, $isElementNode, $isRangeSelection, $isTextNode } from "lexical"
import { $isLinkNode, LinkNode } from "@lexical/link"
import { $getNearestNodeOfType } from "@lexical/utils"

export class NativeAdapter {
  frozenLinkKey = null

  constructor(editorElement) {
    this.editorElement = editorElement
    this.editorContentElement = editorElement.editorContentElement
  }

  dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {
    dispatch(this.editorElement, "lexxy:attributes-change", {
      attributes,
      link: linkHref ? { href: linkHref } : null,
      highlight,
      headingTag
    })
  }

  dispatchEditorInitialized(detail) {
    dispatch(this.editorElement, "lexxy:editor-initialized", detail)
  }

  freeze() {
    let frozenLinkKey = null
    this.editorElement.editor?.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const linkNode = $getNearestNodeOfType(selection.anchor.getNode(), LinkNode)
      if (linkNode) {
        frozenLinkKey = linkNode.getKey()
      }
    })

    this.frozenLinkKey = frozenLinkKey
    this.editorContentElement.contentEditable = "false"
  }

  thaw() {
    this.editorContentElement.contentEditable = "true"
  }

  unlinkFrozenNode() {
    const key = this.frozenLinkKey
    if (!key) return false

    const linkNode = $getNodeByKey(key)
    if (!$isLinkNode(linkNode)) {
      this.frozenLinkKey = null
      return false
    }

    const children = linkNode.getChildren()
    for (const child of children) {
      linkNode.insertBefore(child)
    }
    linkNode.remove()

    // Select the former link text so a follow-up createLink can re-wrap it.
    const firstText = this.#findFirstTextDescendant(children)
    const lastText = this.#findLastTextDescendant(children)
    if (firstText && lastText) {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.anchor.set(firstText.getKey(), 0, "text")
        selection.focus.set(lastText.getKey(), lastText.getTextContent().length, "text")
      }
    }

    this.frozenLinkKey = null
    return true
  }

  #findFirstTextDescendant(nodes) {
    for (const node of nodes) {
      if ($isTextNode(node)) return node
      if ($isElementNode(node)) {
        const nestedTextNode = this.#findFirstTextDescendant(node.getChildren())
        if (nestedTextNode) return nestedTextNode
      }
    }

    return null
  }

  #findLastTextDescendant(nodes) {
    for (let index = nodes.length - 1; index >= 0; index--) {
      const node = nodes[index]
      if ($isTextNode(node)) return node
      if ($isElementNode(node)) {
        const nestedTextNode = this.#findLastTextDescendant(node.getChildren())
        if (nestedTextNode) return nestedTextNode
      }
    }

    return null
  }
}
