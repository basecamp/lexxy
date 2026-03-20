import {
  $createLineBreakNode, $createParagraphNode, $createTextNode, $getNodeByKey, $getRoot, $getSelection,
  $isElementNode, $isLineBreakNode, $isNodeSelection, $isParagraphNode, $isRangeSelection, $isRootNode, $isRootOrShadowRoot, $isTextNode, $setSelection,
  PASTE_TAG
 } from "lexical"

import { $generateNodesFromDOM } from "@lexical/html"
import { $createCodeNode, $isCodeNode } from "@lexical/code"
import { $createHeadingNode, $createQuoteNode, $isQuoteNode } from "@lexical/rich-text"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import { $createLinkNode, $toggleLink } from "@lexical/link"
import { dispatch, parseHtml } from "../helpers/html_helper"
import { $setBlocksType } from "@lexical/selection"
import Uploader from "./contents/uploader"
import { $isActionTextAttachmentNode } from "../nodes/action_text_attachment_node"

export default class Contents {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor

  }

  insertHtml(html, { tag } = {}) {
    this.insertDOM(parseHtml(html), { tag })
  }

  insertDOM(doc, { tag } = {}) {
    this.#unwrapPlaceholderAnchors(doc)
    if (tag === PASTE_TAG) this.#stripTableCellColorStyles(doc)

    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const nodes = $generateNodesFromDOM(this.editor, doc)
      if (!this.#insertUploadNodes(nodes)) {
        selection.insertNodes(nodes)
      }
    }, { tag })
  }

  insertAtCursor(node) {
    let selection = $getSelection() ?? $getRoot().selectEnd()
    const selectedNodes = selection?.getNodes()

    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode()
      if ($isShadowRoot(anchorNode)) {
        const paragraph = $createParagraphNode()
        anchorNode.append(paragraph)
        selection = paragraph.selectStart()
      }
      selection.insertNodes([ node ])
    } else if ($isNodeSelection(selection) && selectedNodes.length > 0) {
      // Overrides Lexical's default behavior of _removing_ the currently selected nodes
      // https://github.com/facebook/lexical/blob/v0.38.2/packages/lexical/src/LexicalSelection.ts#L412
      const lastNode = selectedNodes.at(-1)
      lastNode.insertAfter(node)
    }
  }

  insertAtCursorEnsuringLineBelow(node) {
    this.insertAtCursor(node)
    this.#insertLineBelowIfLastNode(node)
  }

  applyParagraphFormat() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    $setBlocksType(selection, () => $createParagraphNode())
  }

  applyHeadingFormat(tag) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    $setBlocksType(selection, () => $createHeadingNode(tag))
  }

  #applyCodeBlockFormat() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    $setBlocksType(selection, () => $createCodeNode("plain"))
  }

  toggleCodeBlock() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    if (this.#insertNodeIfRoot($createCodeNode("plain"))) return

    const topLevelElement = selection.anchor.getNode().getTopLevelElementOrThrow()

    if (topLevelElement && !$isCodeNode(topLevelElement)) {
      this.#applyCodeBlockFormat()
    } else {
      this.applyParagraphFormat()
    }
  }

  toggleBlockquote() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    if (this.#insertNodeIfRoot($createQuoteNode())) return

    const topLevelElements = this.#topLevelElementsInSelection(selection)

    const allQuoted = topLevelElements.length > 0 && topLevelElements.every($isQuoteNode)

    if (allQuoted) {
      topLevelElements.forEach(node => this.#unwrap(node))
    } else {
      topLevelElements.filter($isQuoteNode).forEach(node => this.#unwrap(node))

      this.#splitParagraphsAtLineBreaks(selection)

      const elements = this.#topLevelElementsInSelection(selection)
      if (elements.length === 0) return

      const blockquote = $createQuoteNode()
      elements[0].insertBefore(blockquote)
      elements.forEach((element) => blockquote.append(element))
    }
  }

  hasSelectedText() {
    let result = false

    this.editor.read(() => {
      const selection = $getSelection()
      result = $isRangeSelection(selection) && !selection.isCollapsed()
    })

    return result
  }

  createLink(url) {
    let linkNodeKey = null

    this.editor.update(() => {
      const textNode = $createTextNode(url)
      const linkNode = $createLinkNode(url)
      linkNode.append(textNode)

      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertNodes([ linkNode ])
        linkNodeKey = linkNode.getKey()
      }
    })

    return linkNodeKey
  }

  createLinkWithSelectedText(url) {
    if (!this.hasSelectedText()) return

    this.editor.update(() => {
      $toggleLink(null)
      $toggleLink(url)
    })
  }

  textBackUntil(string) {
    let result = ""

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!selection || !selection.isCollapsed()) return

      const anchor = selection.anchor
      const anchorNode = anchor.getNode()

      if (!$isTextNode(anchorNode)) return

      const fullText = anchorNode.getTextContent()
      const offset = anchor.offset

      const textBeforeCursor = fullText.slice(0, offset)

      const lastIndex = textBeforeCursor.lastIndexOf(string)
      if (lastIndex !== -1) {
        result = textBeforeCursor.slice(lastIndex + string.length)
      }
    })

    return result
  }

  containsTextBackUntil(string) {
    let result = false

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!selection || !selection.isCollapsed()) return

      const anchor = selection.anchor
      const anchorNode = anchor.getNode()

      if (!$isTextNode(anchorNode)) return

      const fullText = anchorNode.getTextContent()
      const offset = anchor.offset

      const textBeforeCursor = fullText.slice(0, offset)

      result = textBeforeCursor.includes(string)
    })

    return result
  }

  replaceTextBackUntil(stringToReplace, replacementNodes) {
    replacementNodes = Array.isArray(replacementNodes) ? replacementNodes : [ replacementNodes ]

    const selection = $getSelection()
    const { anchorNode, offset } = this.#getTextAnchorData()
    if (!anchorNode) return

    const lastIndex = this.#findLastIndexBeforeCursor(anchorNode, offset, stringToReplace)
    if (lastIndex === -1) return

    this.#performTextReplacement(anchorNode, selection, offset, lastIndex, replacementNodes)
  }

  uploadFiles(files, { selectLast } = {}) {
    if (!this.editorElement.supportsAttachments) {
      console.warn("This editor does not supports attachments (it's configured with [attachments=false])")
      return
    }
    const validFiles = Array.from(files).filter(this.#shouldUploadFile.bind(this))

    this.editor.update(() => {
      const uploader = Uploader.for(this.editorElement, validFiles)
      uploader.$uploadFiles()

      if (selectLast && uploader.nodes?.length) {
        const lastNode = uploader.nodes.at(-1)
        lastNode.selectEnd()
        this.#normalizeSelectionInShadowRoot()
      }
    })
  }

  replaceNodeWithHTML(nodeKey, html, options = {}) {
    this.editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (!node) return

      const selection = $getSelection()
      let wasSelected = false

      if ($isRangeSelection(selection)) {
        const selectedNodes = selection.getNodes()
        wasSelected = selectedNodes.includes(node) || selectedNodes.some(n => n.getParent() === node)

        if (wasSelected) {
          $setSelection(null)
        }
      }

      const replacementNode = options.attachment ? this.#createCustomAttachmentNodeWithHtml(html, options.attachment) : this.#createHtmlNodeWith(html)
      node.replace(replacementNode)

      if (wasSelected) {
        replacementNode.selectEnd()
      }
    })
  }

  insertHTMLBelowNode(nodeKey, html, options = {}) {
    this.editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (!node) return

      const previousNode = node.getTopLevelElement() || node

      const newNode = options.attachment ? this.#createCustomAttachmentNodeWithHtml(html, options.attachment) : this.#createHtmlNodeWith(html)
      previousNode.insertAfter(newNode)
    })
  }

  #insertNodeIfRoot(node) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    const anchorNode = selection.anchor.getNode()
    if ($isRootOrShadowRoot(anchorNode)) {
      anchorNode.append(node)
      node.selectEnd()

      return true
    }

    return false
  }

  #splitParagraphsAtLineBreaks(selection) {
    const anchorKey = selection.anchor.getNode().getKey()
    const focusKey = selection.focus.getNode().getKey()
    const topLevelElements = this.#topLevelElementsInSelection(selection)

    for (const element of topLevelElements) {
      if (!$isParagraphNode(element)) continue

      const children = element.getChildren()
      if (!children.some($isLineBreakNode)) continue

      // Check whether this paragraph needs splitting: skip only if neither
      // selection endpoint is inside it (meaning it's a middle paragraph
      // fully between anchor and focus with no partial lines to split off).
      const hasEndpoint = children.some(child =>
        child.getKey() === anchorKey || child.getKey() === focusKey
      )
      if (!hasEndpoint) continue

      const groups = [ [] ]
      for (const child of children) {
        if ($isLineBreakNode(child)) {
          groups.push([])
          child.remove()
        } else {
          groups[groups.length - 1].push(child)
        }
      }

      for (const group of groups) {
        if (group.length === 0) continue
        const paragraph = $createParagraphNode()
        group.forEach(child => paragraph.append(child))
        element.insertBefore(paragraph)
      }
      if (groups.some(group => group.length > 0)) element.remove()
    }
  }

  #topLevelElementsInSelection(selection) {
    const elements = new Set()
    for (const node of selection.getNodes()) {
      const topLevel = node.getTopLevelElement()
      if (topLevel) elements.add(topLevel)
    }
    return Array.from(elements)
  }

  #insertUploadNodes(nodes) {
    if (nodes.every($isActionTextAttachmentNode)) {
      const uploader = Uploader.for(this.editorElement, [])
      uploader.nodes = nodes
      uploader.$insertUploadNodes()
      return true
    }
  }

  #insertLineBelowIfLastNode(node) {
    this.editor.update(() => {
      const nextSibling = node.getNextSibling()
      if (!nextSibling) {
        const newParagraph = $createParagraphNode()
        node.insertAfter(newParagraph)
        newParagraph.selectStart()
      }
    })
  }

  #unwrap(node) {
    const children = node.getChildren()

    if (children.length == 0) {
      node.insertBefore($createParagraphNode())
    } else {
      children.forEach((child) => {
        if ($isTextNode(child) && child.getTextContent().trim() !== "") {
          const newParagraph = $createParagraphNode()
          newParagraph.append(child)
          node.insertBefore(newParagraph)
        } else if (!$isLineBreakNode(child)) {
          node.insertBefore(child)
        }
      })
    }

    node.remove()
  }

  // Anchors with non-meaningful hrefs (e.g. "#", "") appear in content copied
  // from rendered views where mentions and interactive elements are wrapped in
  // <a href="#"> tags. Unwrap them so their text content pastes as plain text
  // and real links are preserved.
  #unwrapPlaceholderAnchors(doc) {
    for (const anchor of doc.querySelectorAll("a")) {
      const href = anchor.getAttribute("href") || ""
      if (href === "" || href === "#") {
        anchor.replaceWith(...anchor.childNodes)
      }
    }
  }

  // Table cells copied from a page inherit the source theme's inline color
  // styles (e.g. dark-mode backgrounds). Strip them so pasted tables adopt
  // the current theme instead of carrying stale colors.
  #stripTableCellColorStyles(doc) {
    for (const cell of doc.querySelectorAll("td, th")) {
      cell.style.removeProperty("background-color")
      cell.style.removeProperty("background")
      cell.style.removeProperty("color")
    }
  }

  #getTextAnchorData() {
    const selection = $getSelection()
    if (!selection || !selection.isCollapsed()) return { anchorNode: null, offset: 0 }

    const anchor = selection.anchor
    const anchorNode = anchor.getNode()

    if (!$isTextNode(anchorNode)) return { anchorNode: null, offset: 0 }

    return { anchorNode, offset: anchor.offset }
  }

  #findLastIndexBeforeCursor(anchorNode, offset, stringToReplace) {
    const fullText = anchorNode.getTextContent()
    const textBeforeCursor = fullText.slice(0, offset)
    return textBeforeCursor.lastIndexOf(stringToReplace)
  }

  #performTextReplacement(anchorNode, selection, offset, lastIndex, replacementNodes) {
    const fullText = anchorNode.getTextContent()
    const textBeforeString = fullText.slice(0, lastIndex)
    const textAfterCursor = fullText.slice(offset)

    const textNodeBefore = this.#cloneTextNodeFormatting(anchorNode, selection, textBeforeString)
    const textNodeAfter = this.#cloneTextNodeFormatting(anchorNode, selection, textAfterCursor || " ")

    anchorNode.replace(textNodeBefore)

    const lastInsertedNode = this.#insertReplacementNodes(textNodeBefore, replacementNodes)
    lastInsertedNode.insertAfter(textNodeAfter)

    this.#appendLineBreakIfNeeded(textNodeAfter.getParentOrThrow())
    const cursorOffset = textAfterCursor ? 0 : 1
    textNodeAfter.select(cursorOffset, cursorOffset)
  }

  #cloneTextNodeFormatting(anchorNode, selection, text) {
    const parent = anchorNode.getParent()
    const fallbackFormat = parent?.getTextFormat?.() || 0
    const fallbackStyle = parent?.getTextStyle?.() || ""
    const format = $isRangeSelection(selection) && selection.format ? selection.format : (anchorNode.getFormat() || fallbackFormat)
    const style = $isRangeSelection(selection) && selection.style ? selection.style : (anchorNode.getStyle() || fallbackStyle)

    return $createTextNode(text)
      .setFormat(format)
      .setDetail(anchorNode.getDetail())
      .setMode(anchorNode.getMode())
      .setStyle(style)
  }

  #insertReplacementNodes(startNode, replacementNodes) {
    let previousNode = startNode
    for (const node of replacementNodes) {
      previousNode.insertAfter(node)
      previousNode = node
    }
    return previousNode
  }

  #appendLineBreakIfNeeded(paragraph) {
    if ($isParagraphNode(paragraph) && this.editorElement.supportsMultiLine) {
      const children = paragraph.getChildren()
      const last = children[children.length - 1]
      const beforeLast = children[children.length - 2]

      if ($isTextNode(last) && last.getTextContent() === "" && (beforeLast && !$isTextNode(beforeLast))) {
        paragraph.append($createLineBreakNode())
      }
    }
  }

  #createCustomAttachmentNodeWithHtml(html, options = {}) {
    const attachmentConfig = typeof options === "object" ? options : {}

    return new CustomActionTextAttachmentNode({
      sgid: attachmentConfig.sgid || null,
      contentType: "text/html",
      innerHtml: html
    })
  }

  #createHtmlNodeWith(html) {
    const htmlNodes = $generateNodesFromDOM(this.editor, parseHtml(html))
    return htmlNodes[0] || $createParagraphNode()
  }

  #shouldUploadFile(file) {
    return dispatch(this.editorElement, "lexxy:file-accept", { file }, true)
  }

  // When the selection anchor is on a shadow root (e.g. a table cell), Lexical's
  // insertNodes can't find a block parent and fails silently. Normalize the
  // selection to point inside the shadow root's content instead.
  #normalizeSelectionInShadowRoot() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode()
    if (!$isShadowRoot(anchorNode)) return

    // Append a paragraph inside the shadow root so there's a valid text-level
    // target for subsequent insertions. This is necessary because decorator
    // nodes (e.g. attachments) at the end of a table cell leave the selection
    // on the cell itself with no block-level descendant to anchor to.
    const paragraph = $createParagraphNode()
    anchorNode.append(paragraph)
    paragraph.selectStart()
  }
}

function $isShadowRoot(node) {
  return $isElementNode(node) && $isRootOrShadowRoot(node) && !$isRootNode(node)
}
