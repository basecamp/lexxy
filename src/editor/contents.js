import {
  $createLineBreakNode, $createParagraphNode, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $hasUpdateTag,
  $isLineBreakNode, $isParagraphNode, $isRangeSelection, $isRootOrShadowRoot, $isTextNode, $setSelection,
  HISTORY_MERGE_TAG, PASTE_TAG,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND
} from "lexical"

import { $createCodeNode, $isCodeNode } from "@lexical/code"
import { $createHeadingNode, $createQuoteNode, $isQuoteNode } from "@lexical/rich-text"
import { $createListItemNode, $createListNode, $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import { $createLinkNode, $toggleLink } from "@lexical/link"
import { parseHtml } from "../helpers/html_helper"
import { $forEachSelectedTextNode, $setBlocksType } from "@lexical/selection"
import Uploader from "./contents/uploader"
import { $isActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { $createActionTextAttachmentUploadNode, ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node"
import { $getNearestBlockElementAncestorOrThrow } from "@lexical/utils"
import NodeInserter from "./contents/node_inserter"
import { $consecutiveSiblingGroups, $expandSelectionToLineBreaksAndSplitAtEdges, $isShadowRoot, $splitSelectedParagraphsAtInnerLineBreaks } from "../helpers/lexical_helper"

export default class Contents {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
  }

  dispose() {
    this.editorElement = null
    this.editor = null
  }

  get selection() { return this.editorElement.selection }

  insertHtml(html, { tag } = {}) {
    this.insertDOM(parseHtml(html), { tag })
  }

  insertDOM(doc, { tag } = {}) {
    this.editor.update(() => {
      if ($hasUpdateTag(PASTE_TAG)) this.#formatPastedDOM(doc)

      const nodes = this.editorElement.$generateNodesFromDOM(doc)

      if (!$hasUpdateTag(PASTE_TAG) || !this.#dispatchPastedNodesCommand(nodes)) {
        this.#insertUploadNodes(nodes) || this.insertAtCursor(...nodes)
      }
    }, { tag })
  }

  insertAtCursor(...nodes) {
    const selection = $getSelection() ?? $getRoot().selectEnd()
    const inserter = NodeInserter.for(selection)

    inserter.insertNodes(nodes)
  }

  insertAtCursorEnsuringLineBelow(node) {
    this.insertAtCursor(node)
    this.#insertLineBelowIfLastNode(node)
  }

  applyParagraphFormat() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    // Fall back to the nearest block (the list item) rather than the top-level
    // element (the whole list), so removing the bullet from one item leaves the
    // rest of the list intact.
    $expandSelectionToLineBreaksAndSplitAtEdges(selection, (node) => $getNearestBlockElementAncestorOrThrow(node))
    $setBlocksType(selection, () => $createParagraphNode())
  }

  applyHeadingFormat(tag) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    $expandSelectionToLineBreaksAndSplitAtEdges(selection)
    $setBlocksType(selection, () => $createHeadingNode(tag))
  }

  applyUnorderedListFormat() {
    this.#applyListFormat("bullet", INSERT_UNORDERED_LIST_COMMAND)
  }

  applyOrderedListFormat() {
    this.#applyListFormat("number", INSERT_ORDERED_LIST_COMMAND)
  }

  clearFormatting() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    $forEachSelectedTextNode(node => {
      node.setFormat(0)
      node.setStyle("")
    })

    $toggleLink(null)

    this.#topLevelElementsInSelection(selection).filter($isQuoteNode).forEach(node => this.#unwrap(node))

    $setBlocksType(selection, () => $createParagraphNode())
  }

  toggleCodeBlock() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    if (this.#insertNodeIfRoot($createCodeNode("plain"))) return

    const blockElements = this.#blockLevelElementsInSelection(selection)
    const allCode = blockElements.every($isCodeNode)

    if (allCode) {
      blockElements.forEach(node => this.#unwrapCodeBlock(node))
    } else {
      $expandSelectionToLineBreaksAndSplitAtEdges(selection)
      const elements = this.#outermostElements(this.#blockLevelElementsInSelection(selection))
      if (elements.length === 0) return

      const codeNode = $createCodeNode("plain")
      elements.at(-1).insertAfter(codeNode)
      codeNode.selectEnd()
      this.insertAtCursor(...elements)
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

       $expandSelectionToLineBreaksAndSplitAtEdges(selection)
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
    if (!this.editorElement) return // Disposed (e.g. on turbo:before-cache); a late drop can still land here

    if (!this.editorElement.supportsAttachments) {
      console.warn("This editor does not supports attachments (it's configured with [attachments=false])")
      return
    }
    const validFiles = Array.from(files).filter(file => this.editorElement.acceptsFile(file))

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

  $createUploadNode(file) {
    return $createActionTextAttachmentUploadNode({
      file,
      uploadUrl: this.editorElement.directUploadUrl,
      blobUrlTemplate: this.editorElement.blobUrlTemplate,
      contentType: file.type,
    })
  }

  insertPendingAttachment(file) {
    if (!this.editorElement.supportsAttachments) return null

    let nodeKey = null
    this.editor.update(() => {
      const uploadNode = new ActionTextAttachmentUploadNode({
        file,
        uploadUrl: null,
        blobUrlTemplate: this.editorElement.blobUrlTemplate,
        editor: this.editor
      })
      this.insertAtCursor(uploadNode)
      nodeKey = uploadNode.getKey()
    }, { tag: HISTORY_MERGE_TAG })

    if (!nodeKey) return null

    const editor = this.editor
    return {
      setAttributes(blob) {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey)
          if (!(node instanceof ActionTextAttachmentUploadNode)) return

          const replacementNodeKey = node.$showUploadedAttachment(blob)
          if (replacementNodeKey) {
            nodeKey = replacementNodeKey
          }
        }, { tag: HISTORY_MERGE_TAG })
      },
      setUploadProgress(progress) {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey)
          if (!(node instanceof ActionTextAttachmentUploadNode)) return

          node.getWritable().progress = progress
        }, { tag: HISTORY_MERGE_TAG })
      },
      remove() {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey)
          if (node) node.remove()
        })
      }
    }
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

  #formatPastedDOM(doc) {
    this.#unwrapPlaceholderAnchors(doc)
    this.#stripTableCellColorStyles(doc)
  }

  #dispatchPastedNodesCommand(nodes) {
    return this.editor.dispatchCommand(SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, {
      nodes, selection: $getSelection()
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

  #unwrapCodeBlock(codeNode) {
    const children = codeNode.getChildren()
    const groups = [ [] ]

    for (const child of children) {
      if ($isLineBreakNode(child)) {
        groups.push([])
      } else {
        groups[groups.length - 1].push(child.getTextContent())
      }
    }

    for (const group of groups) {
      const paragraph = $createParagraphNode()
      const text = group.join("")
      if (text) {
        paragraph.append($createTextNode(text))
      }
      codeNode.insertBefore(paragraph)
    }

    codeNode.remove()
  }

  #applyListFormat(listType, command) {
    if (this.selection.isInsideBlockQuote) {
      this.#insertListInsideQuote(listType)
    } else {
      this.#splitParagraphsAtLineBreaksUnlessInsideList()
      this.editor.dispatchCommand(command)
    }
  }

  #insertListInsideQuote(listType) {
    for (const group of $consecutiveSiblingGroups(this.#quotedBlocksInSelection())) {
      this.#wrapBlocksInList(group, listType)
    }
  }

  #quotedBlocksInSelection() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return []

    const blocks = this.#outermostElements(this.#blockLevelElementsInSelection(selection))
    return blocks.filter((block) => $isQuoteNode(block.getParent()))
  }

  #wrapBlocksInList(blocks, listType) {
    const list = $createListNode(listType)
    blocks[0].insertBefore(list)

    for (const block of blocks) {
      const listItem = $createListItemNode()
      if ($isListNode(block)) {
        listItem.append(...block.getChildren().flatMap((item) => item.getChildren()))
      } else {
        listItem.append(...block.getChildren())
      }
      list.append(listItem)
      block.remove()
    }
  }

  #splitParagraphsAtLineBreaksUnlessInsideList() {
    if (this.selection.isInsideList) return

    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    $expandSelectionToLineBreaksAndSplitAtEdges(selection)
    $splitSelectedParagraphsAtInnerLineBreaks(selection)
  }

  #blockLevelElementsInSelection(selection) {
    const blocks = new Set()
    for (const node of selection.getNodes()) {
      blocks.add($getNearestBlockElementAncestorOrThrow(node))
    }

    return Array.from(blocks)
  }

  #topLevelElementsInSelection(selection) {
    const elements = new Set()
    for (const node of selection.getNodes()) {
      const topLevel = node.getTopLevelElement()
      if (topLevel) elements.add(topLevel)
    }
    return Array.from(elements)
  }

  // Selections spanning nested structures (a quote and its inner paragraphs,
  // nested list items) yield both an element and its ancestor. Converting the
  // ancestor detaches its whole subtree — including a node freshly inserted
  // inside it — which can leave the selection on removed nodes (Lexical
  // invariant #19). The outermost elements already cover their descendants'
  // text content, so keep only those.
  #outermostElements(elements) {
    return elements.filter((element) => {
      return elements.every((other) => other === element || !element.getParents().includes(other))
    })
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
    const contentType = attachmentConfig.contentType || "text/html"
    if (!this.editorElement.permitsAttachmentContentType(contentType)) {
      return this.#createHtmlNodeWith(html)
    }
    return new CustomActionTextAttachmentNode({
      sgid: attachmentConfig.sgid || null,
      contentType,
      innerHtml: html,
    })
  }

  #createHtmlNodeWith(html) {
    const htmlNodes = this.editorElement.$generateNodesFromDOM(parseHtml(html))
    return htmlNodes[0] || $createParagraphNode()
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
