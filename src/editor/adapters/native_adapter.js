import { dispatch } from "../../helpers/html_helper"
import { $getNodeByKey, $getSelection, $isElementNode, $isRangeSelection, $isTextNode } from "lexical"
import { $isLinkNode, LinkNode } from "@lexical/link"
import { $getNearestNodeOfType } from "@lexical/utils"

const INACTIVE = Object.freeze({ active: false, enabled: false })

export const DEFAULT_ATTRIBUTES = Object.freeze({
  bold: INACTIVE,
  italic: INACTIVE,
  strikethrough: INACTIVE,
  code: INACTIVE,
  highlight: Object.freeze({ active: false, enabled: false, color: null, backgroundColor: null }),
  link: Object.freeze({ active: false, enabled: false, href: null }),
  quote: INACTIVE,
  heading: Object.freeze({ active: null, enabled: false, tag: null }),
  "unordered-list": INACTIVE,
  "ordered-list": INACTIVE,
  undo: INACTIVE,
  redo: INACTIVE
})

export class NativeAdapter {
  frozenLinkKey = null

  constructor(editorElement) {
    this.editorElement = editorElement
    this.editorContentElement = editorElement.editorContentElement
  }

  dispatchAttributesChange(editorState) {
    const { link, highlight, ...attributes } = { ...DEFAULT_ATTRIBUTES, ...this.#computeAttributesPayload(editorState) }

    dispatch(this.editorElement, "lexxy:attributes-change", { attributes, link, highlight, headingTag: attributes.heading.tag })
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

  #computeAttributesPayload(editorState) {
    return editorState.read(() => {
      const format = this.editorElement.selection.getFormat()
      if (Object.keys(format).length === 0) return DEFAULT_ATTRIBUTES

      return {
        ...DEFAULT_ATTRIBUTES,

        bold: { active: format.isBold, enabled: true },
        italic: { active: format.isItalic, enabled: true },
        strikethrough: { active: format.isStrikethrough, enabled: true },
        code: { active: format.isInCode, enabled: true },
        highlight: {
          active: format.isHighlight,
          enabled: true,
          color: format.highlightStyles?.color ?? null,
          backgroundColor: format.highlightStyles?.backgroundColor ?? null
        },
        link: {
          active: format.isInLink,
          enabled: true,
          href: format.linkURL
        },
        quote: { active: format.isInQuote, enabled: true },
        heading: { active: format.isInHeading, enabled: true, tag: format.headingTag },
        "unordered-list": { active: format.listType === "bullet", enabled: true },
        "ordered-list": { active: format.listType === "number", enabled: true },
        undo: { active: false, enabled: this.editorElement.canUndo },
        redo: { active: false, enabled: this.editorElement.canRedo }
      }
    })
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
