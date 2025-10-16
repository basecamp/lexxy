import {
  $createLineBreakNode, $createParagraphNode, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $insertNodes,
  $isElementNode, $isLineBreakNode, $isNodeSelection, $isParagraphNode, $isRangeSelection, $isTextNode, $setSelection, HISTORY_MERGE_TAG
} from "lexical"

import { $generateNodesFromDOM } from "@lexical/html"
import { ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import { $createLinkNode, $toggleLink } from "@lexical/link"
import { dispatch, parseHtml } from "../helpers/html_helper"
import { $isListNode } from "@lexical/list"
import { getNearestListItemNode } from "../helpers/lexical_helper"
import { nextFrame } from "../helpers/timing_helpers.js"
import { FormatEscaper } from "./format_escaper"

export default class Contents {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor

    new FormatEscaper(editorElement).monitor()
  }

  insertHtml(html) {
    this.editor.update(() => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) return

      const nodes = $generateNodesFromDOM(this.editor, parseHtml(html))
      selection.insertNodes(nodes)
    })
  }

  insertAtCursor(node) {
    this.editor.update(() => {
      const selection = $getSelection()
      const selectedNodes = selection?.getNodes()

      if ($isRangeSelection(selection)) {
        $insertNodes([node])
      } else if ($isNodeSelection(selection) && selectedNodes && selectedNodes.length > 0) {
        const lastNode = selectedNodes[selectedNodes.length - 1]
        lastNode.insertAfter(node)
      } else {
        const root = $getRoot()
        root.append(node)
      }
    })
  }

  insertAtCursorEnsuringLineBelow(node) {
    this.insertAtCursor(node)
    this.#insertLineBelowIfLastNode(node)
  }

  insertNodeWrappingEachSelectedLine(newNodeFn) {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const selectedNodes = selection.extract()

      selectedNodes.forEach((node) => {
        const parent = node.getParent()
        if (!parent) { return }

        const topLevelElement = node.getTopLevelElementOrThrow()
        const wrappingNode = newNodeFn()
        wrappingNode.append(...topLevelElement.getChildren())
        topLevelElement.replace(wrappingNode)
      })
    })
  }

  toggleNodeWrappingAllSelectedLines(isFormatAppliedFn, newNodeFn) {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const topLevelElement = selection.anchor.getNode().getTopLevelElementOrThrow()

      // Check if format is already applied
      if (isFormatAppliedFn(topLevelElement)) {
        this.removeFormattingFromSelectedLines()
      } else {
        this.#insertNodeWrappingAllSelectedLines(newNodeFn)
      }
    })
  }

  toggleNodeWrappingAllSelectedNodes(isFormatAppliedFn, newNodeFn) {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const topLevelElement = selection.anchor.getNode().getTopLevelElement()

      // Check if format is already applied
      if (topLevelElement && isFormatAppliedFn(topLevelElement)) {
        this.#unwrap(topLevelElement)
      } else {
        this.#insertNodeWrappingAllSelectedNodes(newNodeFn)
      }
    })
  }

  removeFormattingFromSelectedLines() {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const topLevelElement = selection.anchor.getNode().getTopLevelElementOrThrow()
      const paragraph = $createParagraphNode()
      paragraph.append(...topLevelElement.getChildren())
      topLevelElement.replace(paragraph)
    })
  }

  hasSelectedText() {
    let result = false

    this.editor.read(() => {
      const selection = $getSelection()
      result = $isRangeSelection(selection) && !selection.isCollapsed()
    })

    return result
  }

  unwrapSelectedListItems() {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const { listItems, parentLists } = this.#collectSelectedListItems(selection)
      if (listItems.size > 0) {
        const newParagraphs = this.#convertListItemsToParagraphs(listItems)
        this.#removeEmptyParentLists(parentLists)
        this.#selectNewParagraphs(newParagraphs)
      }
    })
  }

  createLink(url) {
    let linkNodeKey = null

    this.editor.update(() => {
      const textNode = $createTextNode(url)
      const linkNode = $createLinkNode(url)
      linkNode.append(textNode)

      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertNodes([linkNode])
        linkNodeKey = linkNode.getKey()
      }
    })

    return linkNodeKey
  }

  createLinkWithSelectedText(url) {
    if (!this.hasSelectedText()) return

    this.editor.update(() => {
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
    replacementNodes = Array.isArray(replacementNodes) ? replacementNodes : [replacementNodes]

    this.editor.update(() => {
      const { anchorNode, offset } = this.#getTextAnchorData()
      if (!anchorNode) return

      const lastIndex = this.#findLastIndexBeforeCursor(anchorNode, offset, stringToReplace)
      if (lastIndex === -1) return

      this.#performTextReplacement(anchorNode, offset, lastIndex, replacementNodes)
    })
  }

  createParagraphAfterNode(node, text) {
    const newParagraph = $createParagraphNode()
    node.insertAfter(newParagraph)
    newParagraph.selectStart()

    // Insert the typed text
    if (text) {
      newParagraph.append($createTextNode(text))
      newParagraph.select(1, 1) // Place cursor after the text
    }
  }

  createParagraphBeforeNode(node, text) {
    const newParagraph = $createParagraphNode()
    node.insertBefore(newParagraph)
    newParagraph.selectStart()

    // Insert the typed text
    if (text) {
      newParagraph.append($createTextNode(text))
      newParagraph.select(1, 1) // Place cursor after the text
    }
  }

  uploadFile(file) {
    if (!this.editorElement.supportsAttachments) {
      console.warn("This editor does not supports attachments (it's configured with [attachments=false])")
      return
    }

    if (!this.#shouldUploadFile(file)) {
      return
    }

    const uploadUrl = this.editorElement.directUploadUrl
    const blobUrlTemplate = this.editorElement.blobUrlTemplate

    this.editor.update(() => {
      const uploadedImageNode = new ActionTextAttachmentUploadNode({ file: file, uploadUrl: uploadUrl, blobUrlTemplate: blobUrlTemplate, editor: this.editor })
      this.insertAtCursor(uploadedImageNode)
    }, { tag: HISTORY_MERGE_TAG })
  }

  async deleteSelectedNodes() {
    let focusNode = null

    this.editor.update(() => {
      if ($isNodeSelection(this.#selection.current)) {
        const nodesToRemove = this.#selection.current.getNodes()
        if (nodesToRemove.length === 0) return

        focusNode = this.#findAdjacentNodeTo(nodesToRemove)
        this.#deleteNodes(nodesToRemove)
      }
    })

    await nextFrame()

    this.editor.update(() => {
      this.#selectAfterDeletion(focusNode)
      this.#selection.clear()
      this.editor.focus()
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

  get #selection() {
    return this.editorElement.selection
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

    children.forEach((child) => {
      node.insertBefore(child)
    })

    node.remove()
  }

  #insertNodeWrappingAllSelectedNodes(newNodeFn) {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const selectedNodes = selection.extract()
      if (selectedNodes.length === 0) {
        return
      }
      const topLevelElements = new Set()
      selectedNodes.forEach((node) => {
        const topLevel = node.getTopLevelElementOrThrow()
        topLevelElements.add(topLevel)
      })

      const elements = this.#withoutTrailingEmptyParagraphs(Array.from(topLevelElements))
      if (elements.length === 0) {
        this.#removeStandaloneEmptyParagraph()
        this.insertAtCursor(newNodeFn())
        return
      }

      const wrappingNode = newNodeFn()
      elements[0].insertBefore(wrappingNode)
      elements.forEach((element) => {
        wrappingNode.append(element)
      })

      $setSelection(null)
    })
  }

  #withoutTrailingEmptyParagraphs(elements) {
    let lastNonEmptyIndex = elements.length - 1

    // Find the last non-empty paragraph
    while (lastNonEmptyIndex >= 0) {
      const element = elements[lastNonEmptyIndex]
      if (!$isParagraphNode(element) || !this.#isElementEmpty(element)) {
        break
      }
      lastNonEmptyIndex--
    }

    return elements.slice(0, lastNonEmptyIndex + 1)
  }

  #isElementEmpty(element) {
    // Check text content first
    if (element.getTextContent().trim() !== "") return false

    // Check if it only contains line breaks
    const children = element.getChildren()
    return children.length === 0 || children.every(child => $isLineBreakNode(child))
  }

  #removeStandaloneEmptyParagraph() {
    const root = $getRoot()
    if (root.getChildrenSize() === 1) {
      const firstChild = root.getFirstChild()
      if (firstChild && $isParagraphNode(firstChild) && this.#isElementEmpty(firstChild)) {
        firstChild.remove()
      }
    }
  }

  #insertNodeWrappingAllSelectedLines(newNodeFn) {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      if (selection.isCollapsed()) {
        this.#wrapCurrentLine(selection, newNodeFn)
      } else {
        this.#wrapMultipleSelectedLines(selection, newNodeFn)
      }
    })
  }

  #wrapCurrentLine(selection, newNodeFn) {
    const anchorNode = selection.anchor.getNode()
    const topLevelElement = anchorNode.getTopLevelElementOrThrow()

    if (topLevelElement.getTextContent()) {
      const wrappingNode = newNodeFn()
      wrappingNode.append(...topLevelElement.getChildren())
      topLevelElement.replace(wrappingNode)
    } else {
      $insertNodes([newNodeFn()])
    }
  }

  #wrapMultipleSelectedLines(selection, newNodeFn) {
    const selectedParagraphs = this.#extractSelectedParagraphs(selection)
    if (selectedParagraphs.length === 0) return

    const { lineSet, nodesToDelete } = this.#extractUniqueLines(selectedParagraphs)
    if (lineSet.size === 0) return

    const wrappingNode = this.#createWrappingNodeWithLines(newNodeFn, lineSet)
    this.#replaceWithWrappingNode(selection, wrappingNode)
    this.#removeNodes(nodesToDelete)
  }

  #extractSelectedParagraphs(selection) {
    const selectedNodes = selection.extract()
    const selectedParagraphs = selectedNodes
      .map((node) => this.#getParagraphFromNode(node))
      .filter(Boolean)

    $setSelection(null)
    return selectedParagraphs
  }

  #getParagraphFromNode(node) {
    if ($isParagraphNode(node)) return node
    if ($isTextNode(node) && node.getParent() && $isParagraphNode(node.getParent())) {
      return node.getParent()
    }
    return null
  }

  #extractUniqueLines(selectedParagraphs) {
    const lineSet = new Set()
    const nodesToDelete = new Set()

    selectedParagraphs.forEach((paragraphNode) => {
      const textContent = paragraphNode.getTextContent()
      if (textContent) {
        textContent.split("\n").forEach((line) => {
          if (line.trim()) lineSet.add(line)
        })
      }
      nodesToDelete.add(paragraphNode)
    })

    return { lineSet, nodesToDelete }
  }

  #createWrappingNodeWithLines(newNodeFn, lineSet) {
    const wrappingNode = newNodeFn()
    const lines = Array.from(lineSet)

    lines.forEach((lineText, index) => {
      wrappingNode.append($createTextNode(lineText))
      if (index < lines.length - 1) {
        wrappingNode.append($createLineBreakNode())
      }
    })

    return wrappingNode
  }

  #replaceWithWrappingNode(selection, wrappingNode) {
    const anchorNode = selection.anchor.getNode()
    const parent = anchorNode.getParent()
    if (parent) {
      parent.replace(wrappingNode)
    }
  }

  #removeNodes(nodesToDelete) {
    nodesToDelete.forEach((node) => node.remove())
  }

  #deleteNodes(nodes) {
    // Use splice() instead of node.remove() for proper removal and
    // reconciliation. Would have issues with removing unintended decorator nodes
    // with node.remove()
    nodes.forEach((node) => {
      const parent = node.getParent()
      if (!$isElementNode(parent)) return

      const children = parent.getChildren()
      const index = children.indexOf(node)

      if (index >= 0) {
        parent.splice(index, 1, [])
      }
    })
  }

  #findAdjacentNodeTo(nodes) {
    const firstNode = nodes[0]
    const lastNode = nodes[nodes.length - 1]

    return firstNode?.getPreviousSibling() || lastNode?.getNextSibling()
  }

  #selectAfterDeletion(focusNode) {
    const root = $getRoot()
    if (root.getChildrenSize() === 0) {
      const newParagraph = $createParagraphNode()
      root.append(newParagraph)
      newParagraph.selectStart()
    } else if (focusNode) {
      if ($isTextNode(focusNode) || $isParagraphNode(focusNode)) {
        focusNode.selectEnd()
      } else {
        focusNode.selectNext(0, 0)
      }
    }
  }

  #collectSelectedListItems(selection) {
    const nodes = selection.getNodes()
    const listItems = new Set()
    const parentLists = new Set()

    for (const node of nodes) {
      const listItem = getNearestListItemNode(node)
      if (listItem) {
        listItems.add(listItem)
        const parentList = listItem.getParent()
        if (parentList && $isListNode(parentList)) {
          parentLists.add(parentList)
        }
      }
    }

    return { listItems, parentLists }
  }

  #convertListItemsToParagraphs(listItems) {
    const newParagraphs = []

    for (const listItem of listItems) {
      const paragraph = this.#convertListItemToParagraph(listItem)
      if (paragraph) {
        newParagraphs.push(paragraph)
      }
    }

    return newParagraphs
  }

  #convertListItemToParagraph(listItem) {
    const parentList = listItem.getParent()
    if (!parentList || !$isListNode(parentList)) return null

    const paragraph = $createParagraphNode()
    const sublists = this.#extractSublistsAndContent(listItem, paragraph)

    listItem.insertAfter(paragraph)
    this.#insertSublists(paragraph, sublists)
    listItem.remove()

    return paragraph
  }

  #extractSublistsAndContent(listItem, paragraph) {
    const sublists = []

    listItem.getChildren().forEach((child) => {
      if ($isListNode(child)) {
        sublists.push(child)
      } else {
        paragraph.append(child)
      }
    })

    return sublists
  }

  #insertSublists(paragraph, sublists) {
    sublists.forEach((sublist) => {
      paragraph.insertAfter(sublist)
    })
  }

  #removeEmptyParentLists(parentLists) {
    for (const parentList of parentLists) {
      if ($isListNode(parentList) && parentList.getChildrenSize() === 0) {
        parentList.remove()
      }
    }
  }

  #selectNewParagraphs(newParagraphs) {
    if (newParagraphs.length === 0) return

    const firstParagraph = newParagraphs[0]
    const lastParagraph = newParagraphs[newParagraphs.length - 1]

    if (newParagraphs.length === 1) {
      firstParagraph.selectEnd()
    } else {
      this.#selectParagraphRange(firstParagraph, lastParagraph)
    }
  }

  #selectParagraphRange(firstParagraph, lastParagraph) {
    firstParagraph.selectStart()
    const currentSelection = $getSelection()
    if (currentSelection && $isRangeSelection(currentSelection)) {
      currentSelection.anchor.set(firstParagraph.getKey(), 0, "element")
      currentSelection.focus.set(lastParagraph.getKey(), lastParagraph.getChildrenSize(), "element")
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

  #performTextReplacement(anchorNode, offset, lastIndex, replacementNodes) {
    const fullText = anchorNode.getTextContent()
    const textBeforeString = fullText.slice(0, lastIndex)
    const textAfterCursor = fullText.slice(offset)

    const textNodeBefore = $createTextNode(textBeforeString)
    const textNodeAfter = $createTextNode(textAfterCursor || " ")

    anchorNode.replace(textNodeBefore)

    const lastInsertedNode = this.#insertReplacementNodes(textNodeBefore, replacementNodes)
    lastInsertedNode.insertAfter(textNodeAfter)

    this.#appendLineBreakIfNeeded(textNodeAfter.getParentOrThrow())
    const cursorOffset = textAfterCursor ? 0 : 1
    textNodeAfter.select(cursorOffset, cursorOffset)
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
    if ($isParagraphNode(paragraph) && !this.editorElement.isSingleLineMode) {
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
}
