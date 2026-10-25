import { dispatch } from "../../helpers/html_helper"
import { $getNodeByKey, $getSelection, $isElementNode, $isRangeSelection, $isTextNode } from "lexical"
import { $isLinkNode } from "@lexical/link"

const FORMAT_ATTRIBUTES = [ "bold", "italic", "strikethrough", "code", "highlight", "link", "quote", "heading", "unordered-list", "ordered-list" ]

export class NativeAdapter {
  frozenLinkKey = null

  constructor(editorElement) {
    this.editorElement = editorElement
    this.editorContentElement = editorElement.editorContentElement
  }

  dispatchAttributesChange(editorOrState) {
    const format = editorOrState.read(() => this.editorElement.selection.getFormat())

    dispatch(this.editorElement, "lexxy:attributes-change", {
      attributes: this.#attributesFor(format),
      link: format.linkUrl ? { href: format.linkUrl } : null,
      highlight: format.highlightStyles ?? null,
      headingTag: format.headingTag ?? null
    })
  }

  dispatchEditorInitialized(detail) {
    dispatch(this.editorElement, "lexxy:editor-initialized", detail)
  }

  freeze() {
    let frozenLinkKey = null
    this.editorElement.editor?.getEditorState().read(() => {
      if (!$isRangeSelection($getSelection())) return

      frozenLinkKey = this.editorElement.selection.linkAtCursor?.getKey() ?? null
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

  #attributesFor(format) {
    const history = {
      undo: { active: false, enabled: this.editorElement.canUndo },
      redo: { active: false, enabled: this.editorElement.canRedo }
    }

    if (Object.keys(format).length === 0) {
      return { ...Object.fromEntries(FORMAT_ATTRIBUTES.map(name => [ name, { active: false, enabled: false } ])), ...history }
    } else {
      return {
        bold: { active: format.isBold, enabled: true },
        italic: { active: format.isItalic, enabled: true },
        strikethrough: { active: format.isStrikethrough, enabled: true },
        code: { active: format.isInCode, enabled: true },
        highlight: { active: format.isHighlight, enabled: true },
        link: { active: format.isInLink, enabled: true },
        quote: { active: format.isInQuote, enabled: true },
        heading: { active: format.isInHeading, enabled: true },
        "unordered-list": { active: format.listType === "bullet", enabled: true },
        "ordered-list": { active: format.listType === "number", enabled: true },
        ...history
      }
    }
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
      const node = nodes
      if ($isTextNode(node)) return node
      if ($isElementNode(node)) {
        const nestedTextNode = this.#findLastTextDescendant(node.getChildren())
        if (nestedTextNode) return nestedTextNode
      }
    }

    return null
  }
}
