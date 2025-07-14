import {
  $createParagraphNode, $getSelection, $setSelection, $insertNodes, $isElementNode, $isParagraphNode, $isTextNode,
  $isRangeSelection, $createLineBreakNode, $createTextNode, HISTORY_MERGE_TAG, $isNodeSelection, $getRoot
} from "lexical"

import { $generateNodesFromDOM } from "@lexical/html"
import { ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node"
import { $createLinkNode } from "@lexical/link"
import { parseHtml } from "../helpers/html_helper"

export default class Contents {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
  }

  insertHtml(html) {
    this.editor.update(() => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) return

      const nodes = $generateNodesFromDOM(this.editor, parseHtml(html))
      selection.insertNodes(nodes)
    })
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

  insertNodeWrappingAllSelectedLines(newNodeFn) {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const selectedNodes = selection.extract()
      const selectedParagraphs = selectedNodes.map((node) => $isParagraphNode(node) ? node : $isTextNode(node) && node.getParent() && $isParagraphNode(node.getParent()) ? node.getParent() : null).filter(Boolean)

      $setSelection(null)
      if (selectedParagraphs.length === 0) return

      const lineSet = new Set()
      const nodesToDelete = new Set()

      // Extract and deduplicate lines from paragraph content
      selectedParagraphs.forEach((paragraphNode) => {
        const textContent = paragraphNode.getTextContent()
        if (textContent) {
          const lineTexts = textContent.split("\n")
          lineTexts.forEach((line) => {
            if (line.trim()) {
              lineSet.add(line)
            }
          })
        }
        nodesToDelete.add(paragraphNode)
      })

      if (lineSet.size === 0) return

      const wrappingNode = newNodeFn()

      // Append each unique line to the new wrapping node
      Array.from(lineSet).forEach((lineText, index, arr) => {
        wrappingNode.append($createTextNode(lineText))
        if (index < arr.length - 1) {
          wrappingNode.append($createLineBreakNode())
        }
      })

      // Replace the current location with the new wrapping node
      const anchorNode = selection.anchor.getNode()
      const parent = anchorNode.getParent()
      if (parent) {
        parent.replace(wrappingNode)
      }

      // Remove original nodes
      nodesToDelete.forEach((node) => node.remove())
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

  createLinkWithSelectedText(url) {
    if (!this.hasSelectedText()) return

    this.editor.update(() => {
      const selection = $getSelection()
      const selectedText = selection.getTextContent()

      const linkNode = $createLinkNode(url)
      linkNode.append($createTextNode(selectedText))

      selection.insertNodes([ linkNode ])
    })
  }

  unfurlLink(linkUrl, unfurlData) {
    if (unfurlData.title) {
      this.editor.update(() => {
        // I couldn't find a better way to search for matching Lexical nodes.
        const textNodes = []
        function traverseNodes(node) {
          if ($isTextNode(node) && node.getTextContent() === linkUrl) { textNodes.push(node) }
          if ($isElementNode(node)) {
            for (const child of node.getChildren()) { traverseNodes(child) }
          }
        }
        traverseNodes($getRoot())

        textNodes.forEach(linkNode => {
          linkNode.setTextContent(unfurlData.title)

          // Ensure cursor is after the text link.
          // (This is racy but I'm not sure how to do it more cleanly.)
          linkNode.selectEnd()
        })
      })
    }
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
      const selection = $getSelection()
      if (!selection || !selection.isCollapsed()) return

      const anchor = selection.anchor
      const anchorNode = anchor.getNode()

      if (!$isTextNode(anchorNode)) return

      const fullText = anchorNode.getTextContent()
      const offset = anchor.offset

      const textBeforeCursor = fullText.slice(0, offset)
      const lastIndex = textBeforeCursor.lastIndexOf(stringToReplace)

      if (lastIndex === -1) return

      const textBeforeString = fullText.slice(0, lastIndex)
      const textAfterCursor = fullText.slice(offset)
      const textNodeBefore = $createTextNode(textBeforeString)
      const textNodeAfter = $createTextNode(textAfterCursor || " ") // Default to Space to prevent cursor rendering issues in Safari

      // Replace the anchor node with the first node
      anchorNode.replace(textNodeBefore)

      // Insert replacement nodes in sequence
      let previousNode = textNodeBefore
      for (const node of replacementNodes) {
        previousNode.insertAfter(node)
        previousNode = node
      }

      // Insert the text after cursor
      previousNode.insertAfter(textNodeAfter)

      this.#appendLineBreakIfNeeded(textNodeAfter.getParentOrThrow())

      // Place the cursor at the start of textNodeAfter
      textNodeAfter.select(0, 0)
    })
  }

  uploadFile(file) {
    if (!this.editorElement.supportsAttachments) {
      console.warn("This editor does not supports attachments (it's configured with [attachments=false])")
      return
    }

    const uploadUrl = this.editorElement.directUploadUrl
    const blobUrlTemplate = this.editorElement.blobUrlTemplate

    this.editor.update(() => {
      const selection = $getSelection()
      const anchorNode = selection?.anchor.getNode()
      const currentParagraph = anchorNode?.getTopLevelElement()

      const uploadedImageNode = new ActionTextAttachmentUploadNode({ file: file, uploadUrl: uploadUrl, blobUrlTemplate: blobUrlTemplate, editor: this.editor })

      if (currentParagraph && $isParagraphNode(currentParagraph) && currentParagraph.getChildrenSize() === 0) {
        // If we're inside an empty paragraph, replace it
        currentParagraph.replace(uploadedImageNode)
      } else if (currentParagraph && $isElementNode(currentParagraph)) {
        currentParagraph.insertAfter(uploadedImageNode)
      } else {
        $insertNodes([uploadedImageNode])
      }
    }, { tag: HISTORY_MERGE_TAG })
  }

  deleteSelectedNodes() {
    this.editor.update(() => {
      if ($isNodeSelection(this.#selection.current)) {
        let nodesWereRemoved = false
        this.#selection.current.getNodes().forEach((node) => {
          const parent = node.getParent()

          node.remove()

          if (parent.getType() === "root" && parent.getChildrenSize() === 0) {
            parent.append($createParagraphNode())
          }

          nodesWereRemoved = true
        })

        if (nodesWereRemoved) {
          this.#selection.clear()
          this.editor.focus()

          return true
        }
      }
    })
  }

  get #selection() {
    return this.editorElement.selection
  }

  // Add line break if last node is not a textual one to get a visible cursor
  #appendLineBreakIfNeeded(paragraph) {
    if ($isParagraphNode(paragraph) && !this.editorElement.isSingleLineMode) {
      const children = paragraph.getChildren()
      const last = children[children.length - 1]
      const beforeLast = children[children.length - 2]

      if (($isTextNode(last) && last.getTextContent() === "") && (beforeLast && !$isTextNode(beforeLast))) {
        paragraph.append($createLineBreakNode())
      }
    }
  }
}
