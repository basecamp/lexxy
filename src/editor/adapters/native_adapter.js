import { dispatch } from "../../helpers/html_helper"
import { getHighlightStyles } from "../../helpers/format_helper"
import { $getNodeByKey, $getSelection, $isElementNode, $isRangeSelection, $isTextNode } from "lexical"
import { $isLinkNode } from "@lexical/link"

export class NativeAdapter {
  frozenLinkKey = null

  constructor(editorElement) {
    this.editorElement = editorElement
    this.editorContentElement = editorElement.editorContentElement
  }

  dispatchAttributesChange(editorOrState) {
    dispatch(this.editorElement, "lexxy:attributes-change", editorOrState.read(() => this.#attributesChangeDetail()))
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

  #attributesChangeDetail() {
    const { selection } = this.editorElement
    const format = selection.getFormat()
    const linkUrl = selection.linkUrl

    return {
      attributes: this.#attributesFor(format),
      link: linkUrl ? { href: linkUrl } : null,
      highlight: format.isHighlight ? getHighlightStyles($getSelection()) : null,
      headingTag: format.headingTag ?? null
    }
  }

  // getFormat() is empty without a range selection, which leaves every format disabled.
  #attributesFor(format) {
    const enabled = Object.keys(format).length > 0

    return {
      bold: { active: Boolean(format.isBold), enabled },
      italic: { active: Boolean(format.isItalic), enabled },
      strikethrough: { active: Boolean(format.isStrikethrough), enabled },
      code: { active: Boolean(format.isInCode), enabled },
      highlight: { active: Boolean(format.isHighlight), enabled },
      link: { active: Boolean(format.isInLink), enabled },
      quote: { active: Boolean(format.isInQuote), enabled },
      heading: { active: Boolean(format.isInHeading), enabled },
      "unordered-list": { active: format.listType === "bullet", enabled },
      "ordered-list": { active: format.listType === "number", enabled },
      undo: { active: false, enabled: this.editorElement.canUndo },
      redo: { active: false, enabled: this.editorElement.canRedo }
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
