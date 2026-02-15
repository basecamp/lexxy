import {
  $createNodeSelection, $createParagraphNode, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $isElementNode,
  $isLineBreakNode, $isNodeSelection, $isRangeSelection, $isTextNode, $setSelection,
  COMMAND_PRIORITY_LOW, COMMAND_PRIORITY_NORMAL, DecoratorNode,
  KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND, KEY_ENTER_COMMAND, SELECTION_CHANGE_COMMAND
} from "lexical"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $getListDepth, ListNode } from "@lexical/list"
import { TableCellNode } from "@lexical/table"
import { CodeNode } from "@lexical/code"
import { nextFrame } from "../helpers/timing_helpers"
import { getNonce } from "../helpers/csp_helper"
import { getNearestListItemNode, isPrintableCharacter } from "../helpers/lexical_helper"
import { GalleryNode } from "../nodes/gallery_node"
import { GalleryImageNode } from "../nodes/gallery_image_node"

export default class Selection {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editorContentElement = editorElement.editorContentElement
    this.editor = this.editorElement.editor
    this.previouslySelectedKeys = new Set()

    this.#listenForNodeSelections()
    this.#processSelectionChangeCommands()
    this.#handleInputWhenDecoratorNodesSelected()
    this.#containEditorFocus()
  }

  set current(selection) {
    this.editor.update(() => {
      this.#syncSelectedClasses()
    })
  }

  get hasNodeSelection() {
    let result = false
    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      result = selection !== null && $isNodeSelection(selection)
    })
    return result
  }

  get cursorPosition() {
    let position = { x: 0, y: 0 }

    this.editor.getEditorState().read(() => {
      const range = this.#getValidSelectionRange()
      if (!range) return

      const rect = this.#getReliableRectFromRange(range)
      if (!rect) return

      position = this.#calculateCursorPosition(rect, range)
    })

    return position
  }

  placeCursorAtTheEnd() {
    this.editor.update(() => {
      const root = $getRoot()
      const lastDescendant = root.getLastDescendant()

      if (lastDescendant && $isTextNode(lastDescendant)) {
        lastDescendant.selectEnd()
      } else {
        root.selectEnd()
      }
    })
  }

  selectedNodeWithOffset() {
    const selection = $getSelection()
    if (!selection) return { node: null, offset: 0 }

    if ($isRangeSelection(selection)) {
      return {
        node: selection.anchor.getNode(),
        offset: selection.anchor.offset
      }
    } else if ($isNodeSelection(selection)) {
      const [ node ] = selection.getNodes()
      return {
        node,
        offset: 0
      }
    }

    return { node: null, offset: 0 }
  }

  preservingSelection(fn) {
    let selectionState = null

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (selection && $isRangeSelection(selection)) {
        selectionState = {
          anchor: { key: selection.anchor.key, offset: selection.anchor.offset },
          focus: { key: selection.focus.key, offset: selection.focus.offset }
        }
      }
    })

    fn()

    if (selectionState) {
      this.editor.update(() => {
        const selection = $getSelection()
        if (selection && $isRangeSelection(selection)) {
          selection.anchor.set(selectionState.anchor.key, selectionState.anchor.offset, "text")
          selection.focus.set(selectionState.focus.key, selectionState.focus.offset, "text")
        }
      })
    }
  }

  get hasSelectedWordsInSingleLine() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    if (selection.isCollapsed()) return false

    const anchorNode = selection.anchor.getNode()
    const focusNode = selection.focus.getNode()

    if (anchorNode.getTopLevelElement() !== focusNode.getTopLevelElement()) {
      return false
    }

    const anchorElement = anchorNode.getTopLevelElement()
    if (!anchorElement) return false

    const nodes = selection.getNodes()
    for (const node of nodes) {
      if ($isLineBreakNode(node)) {
        return false
      }
    }

    return true
  }

  get isInsideList() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    const anchorNode = selection.anchor.getNode()
    return getNearestListItemNode(anchorNode) !== null
  }

  get isIndentedList() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    const nodes = selection.getNodes()
    for (const node of nodes) {
      const closestListNode = $getNearestNodeOfType(node, ListNode)
      if (closestListNode && $getListDepth(closestListNode) > 1) {
        return true
      }
    }

    return false
  }

  get isInsideCodeBlock() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    const anchorNode = selection.anchor.getNode()
    return $getNearestNodeOfType(anchorNode, CodeNode) !== null
  }

  get isTableCellSelected() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    const anchorNode = selection.anchor.getNode()
    return $getNearestNodeOfType(anchorNode, TableCellNode) !== null
  }

  get nodeAfterCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData()
    if (!anchorNode) return null

    if ($isTextNode(anchorNode)) {
      return this.#getNodeAfterTextNode(anchorNode, offset)
    }

    if ($isElementNode(anchorNode)) {
      return this.#getNodeAfterElementNode(anchorNode, offset)
    }

    return this.#findNextSiblingUp(anchorNode)
  }

  get topLevelNodeAfterCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData()
    if (!anchorNode) return null

    if ($isTextNode(anchorNode)) {
      return this.#getNextNodeFromTextEnd(anchorNode)
    }

    if ($isElementNode(anchorNode)) {
      return this.#getNodeAfterElementNode(anchorNode, offset)
    }

    return this.#findNextSiblingUp(anchorNode)
  }

  get nodeBeforeCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData()
    if (!anchorNode) return null

    if ($isTextNode(anchorNode)) {
      return this.#getNodeBeforeTextNode(anchorNode, offset)
    }

    if ($isElementNode(anchorNode)) {
      return this.#getNodeBeforeElementNode(anchorNode, offset)
    }

    return this.#findPreviousSiblingUp(anchorNode)
  }

  get topLevelNodeBeforeCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData()
    if (!anchorNode) return null

    if ($isTextNode(anchorNode)) {
      return this.#getPreviousNodeFromTextStart(anchorNode)
    }

    if ($isElementNode(anchorNode)) {
      return this.#getNodeBeforeElementNode(anchorNode, offset)
    }

    return this.#findPreviousSiblingUp(anchorNode)
  }

  get #contents() {
    return this.editorElement.contents
  }

  get #currentlySelectedKeys() {
    if (this.currentlySelectedKeys) { return this.currentlySelectedKeys }

    this.currentlySelectedKeys = new Set()

    const selection = $getSelection()
    if (selection && $isNodeSelection(selection)) {
      for (const node of selection.getNodes()) {
        this.currentlySelectedKeys.add(node.getKey())
      }
    }

    return this.currentlySelectedKeys
  }

  #processSelectionChangeCommands() {
    this.editor.registerCommand(KEY_ARROW_LEFT_COMMAND, this.#selectPreviousNode.bind(this), COMMAND_PRIORITY_LOW)
    this.editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, this.#selectNextNode.bind(this), COMMAND_PRIORITY_LOW)
    this.editor.registerCommand(KEY_ARROW_UP_COMMAND, this.#selectPreviousTopLevelNode.bind(this), COMMAND_PRIORITY_LOW)
    this.editor.registerCommand(KEY_ARROW_DOWN_COMMAND, this.#selectNextTopLevelNode.bind(this), COMMAND_PRIORITY_LOW)

    this.editor.registerCommand(KEY_ENTER_COMMAND, this.#splitGalleryOnEnter.bind(this), COMMAND_PRIORITY_NORMAL)
    this.editor.registerCommand(KEY_DELETE_COMMAND, this.#deleteSelectedOrNext.bind(this), COMMAND_PRIORITY_LOW)
    this.editor.registerCommand(KEY_BACKSPACE_COMMAND, this.#deletePreviousOrNext.bind(this), COMMAND_PRIORITY_LOW)

    this.editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
      this.current = $getSelection()
    }, COMMAND_PRIORITY_LOW)
  }

  #listenForNodeSelections() {
    this.editor.getRootElement().addEventListener("lexxy:internal:select-node", async (event) => {
      await nextFrame()

      const { key } = event.detail
      this.editor.update(() => {
        const node = $getNodeByKey(key)
        if (node) {
          const selection = $createNodeSelection()
          selection.add(node.getKey())
          $setSelection(selection)
        }
        this.editor.focus()
      })
    })

    this.editor.getRootElement().addEventListener("lexxy:internal:move-to-next-line", (event) => {
      this.#selectOrAppendNextLine()
    })
  }

  // In Safari, when the only node in the document is an attachment, it won't let you enter text
  // before/below it. There is probably a better fix here, but this workaround solves the problem until
  // we find it.
  #handleInputWhenDecoratorNodesSelected() {
    this.editor.getRootElement().addEventListener("keydown", (event) => {
      if (isPrintableCharacter(event)) {
        this.editor.update(() => {
          const selection = $getSelection()

          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode()
            const offset = selection.anchor.offset

            // When cursor is between gallery images, split the gallery and type in a new paragraph
            if (anchorNode instanceof GalleryNode) {
              event.preventDefault()
              this.#splitGalleryAtOffset(anchorNode, offset, event.key)
              return
            }

            const nodeBefore = this.#getNodeBeforePosition(anchorNode, offset)
            const nodeAfter = this.#getNodeAfterPosition(anchorNode, offset)

            if (nodeBefore instanceof DecoratorNode && !nodeBefore.isInline()) {
              event.preventDefault()
              this.#contents.createParagraphAfterNode(nodeBefore, event.key)
              return
            } else if (nodeAfter instanceof DecoratorNode && !nodeAfter.isInline()) {
              event.preventDefault()
              this.#contents.createParagraphBeforeNode(nodeAfter, event.key)
              return
            }
          }
        })
      }
    }, true)
  }

  #getNodeBeforePosition(node, offset) {
    if ($isTextNode(node) && offset === 0) {
      return node.getPreviousSibling()
    }
    if ($isElementNode(node) && offset > 0) {
      return node.getChildAtIndex(offset - 1)
    }
    return null
  }

  #getNodeAfterPosition(node, offset) {
    if ($isTextNode(node) && offset === node.getTextContentSize()) {
      return node.getNextSibling()
    }
    if ($isElementNode(node)) {
      return node.getChildAtIndex(offset)
    }
    return null
  }

  #containEditorFocus() {
    // Workaround for a bizarre Chrome bug where the cursor abandons the editor to focus on not-focusable elements
    // above when navigating UP/DOWN when Lexical shows its fake cursor on custom decorator nodes.
    this.editorContentElement.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp") {
        const lexicalCursor = this.editor.getRootElement().querySelector("[data-lexical-cursor]")

        if (lexicalCursor) {
          let currentElement = lexicalCursor.previousElementSibling
          while (currentElement && currentElement.hasAttribute("data-lexical-cursor")) {
            currentElement = currentElement.previousElementSibling
          }

          if (!currentElement) {
            event.preventDefault()
          }
        }
      }

      if (event.key === "ArrowDown") {
        const lexicalCursor = this.editor.getRootElement().querySelector("[data-lexical-cursor]")

        if (lexicalCursor) {
          let currentElement = lexicalCursor.nextElementSibling
          while (currentElement && currentElement.hasAttribute("data-lexical-cursor")) {
            currentElement = currentElement.nextElementSibling
          }

          if (!currentElement) {
            event.preventDefault()
          }
        }
      }
    }, true)
  }

  #syncSelectedClasses() {
    this.#clearPreviouslyHighlightedItems()
    this.#highlightNewItems()

    this.previouslySelectedKeys = this.#currentlySelectedKeys
    this.currentlySelectedKeys = null
  }

  #clearPreviouslyHighlightedItems() {
    for (const key of this.previouslySelectedKeys) {
      if (!this.#currentlySelectedKeys.has(key)) {
        const dom = this.editor.getElementByKey(key)
        if (dom) dom.classList.remove("node--selected")
      }
    }
  }

  #highlightNewItems() {
    for (const key of this.#currentlySelectedKeys) {
      if (!this.previouslySelectedKeys.has(key)) {
        const nodeElement = this.editor.getElementByKey(key)
        if (nodeElement) nodeElement.classList.add("node--selected")
      }
    }
  }

  async #selectPreviousNode() {
    if (this.hasNodeSelection) {
      await this.#withCurrentNode((currentNode) => currentNode.selectPrevious())
    } else {
      this.#selectNodeOrEnterGallery(this.nodeBeforeCursor, "last")
    }
  }

  async #selectNextNode() {
    if (this.hasNodeSelection) {
      await this.#withCurrentNode((currentNode) => currentNode.selectNext(0, 0))
    } else {
      this.#selectNodeOrEnterGallery(this.nodeAfterCursor, "first")
    }
  }

  async #selectPreviousTopLevelNode() {
    if (this.hasNodeSelection) {
      await this.#withCurrentNode((currentNode) => {
        if (currentNode instanceof GalleryImageNode) {
          this.#galleryNavigateUp(currentNode)
        } else {
          currentNode.getTopLevelElement().selectPrevious()
        }
      })
    } else {
      this.#selectNodeOrEnterGallery(this.topLevelNodeBeforeCursor, "last")
    }
  }

  async #selectNextTopLevelNode() {
    if (this.hasNodeSelection) {
      await this.#withCurrentNode((currentNode) => {
        if (currentNode instanceof GalleryImageNode) {
          this.#galleryNavigateDown(currentNode)
        } else {
          currentNode.getTopLevelElement().selectNext(0, 0)
        }
      })
    } else {
      this.#selectNodeOrEnterGallery(this.topLevelNodeAfterCursor, "first")
    }
  }

  async #withCurrentNode(fn) {
    await nextFrame()
    if (this.hasNodeSelection) {
      this.editor.update(() => {
        fn($getSelection().getNodes()[0])
        this.editor.focus()
      })
    }
  }

  async #selectOrAppendNextLine() {
    this.editor.update(() => {
      const topLevelElement = this.#getTopLevelElementFromSelection()
      if (!topLevelElement) return

      this.#moveToOrCreateNextLine(topLevelElement)
    })
  }

  #getTopLevelElementFromSelection() {
    const selection = $getSelection()
    if (!selection) return null

    if ($isNodeSelection(selection)) {
      return this.#getTopLevelFromNodeSelection(selection)
    }

    if ($isRangeSelection(selection)) {
      return this.#getTopLevelFromRangeSelection(selection)
    }

    return null
  }

  #getTopLevelFromNodeSelection(selection) {
    const nodes = selection.getNodes()
    return nodes.length > 0 ? nodes[0].getTopLevelElement() : null
  }

  #getTopLevelFromRangeSelection(selection) {
    const anchorNode = selection.anchor.getNode()
    return anchorNode.getTopLevelElement()
  }

  #moveToOrCreateNextLine(topLevelElement) {
    const nextSibling = topLevelElement.getNextSibling()

    if (nextSibling) {
      nextSibling.selectStart()
    } else {
      this.#createAndSelectNewParagraph()
    }
  }

  #createAndSelectNewParagraph() {
    const root = $getRoot()
    const newParagraph = $createParagraphNode()
    root.append(newParagraph)
    newParagraph.selectStart()
  }

  #selectInLexical(node) {
    if (!node || !(node instanceof DecoratorNode)) return

    this.editor.update(() => {
      const selection = $createNodeSelection()
      selection.add(node.getKey())
      $setSelection(selection)
    })
  }

  #selectNodeOrEnterGallery(node, position) {
    if (!node) return

    if (node instanceof GalleryNode) {
      const child = position === "first" ? node.getFirstChild() : node.getLastChild()
      if (child instanceof GalleryImageNode) {
        this.#selectInLexical(child)
      }
      return
    }

    if (node instanceof DecoratorNode) {
      this.#selectInLexical(node)
      return
    }

    if ($isElementNode(node)) {
      this.editor.update(() => {
        if (position === "first") {
          node.selectStart()
        } else {
          node.selectEnd()
        }
      })
    }
  }

  // Gallery navigation: Up arrow from a selected gallery image
  #galleryNavigateUp(imageNode) {
    const gallery = imageNode.getParent()
    if (!(gallery instanceof GalleryNode)) {
      imageNode.selectPrevious()
      return
    }

    const index = imageNode.getIndexWithinParent()
    const columns = GalleryNode.COLUMNS
    const targetIndex = index - columns

    if (targetIndex < 0) {
      gallery.selectPrevious()
    } else {
      const targetNode = gallery.getChildAtIndex(targetIndex)
      if (targetNode) {
        const selection = $createNodeSelection()
        selection.add(targetNode.getKey())
        $setSelection(selection)
      }
    }
  }

  // Gallery navigation: Down arrow from a selected gallery image
  #galleryNavigateDown(imageNode) {
    const gallery = imageNode.getParent()
    if (!(gallery instanceof GalleryNode)) {
      imageNode.selectNext(0, 0)
      return
    }

    const index = imageNode.getIndexWithinParent()
    const columns = GalleryNode.COLUMNS
    const childCount = gallery.getChildrenSize()
    const targetIndex = index + columns

    if (targetIndex >= childCount) {
      gallery.selectNext(0, 0)
    } else {
      const targetNode = gallery.getChildAtIndex(targetIndex)
      if (targetNode) {
        const selection = $createNodeSelection()
        selection.add(targetNode.getKey())
        $setSelection(selection)
      }
    }
  }

  // Split a gallery at the given child offset, inserting a paragraph with the typed character
  #splitGalleryAtOffset(galleryNode, offset, text) {
    const children = galleryNode.getChildren()

    // Images after the cursor go into a new gallery
    const imagesAfter = children.slice(offset)

    if (imagesAfter.length > 0) {
      const newGallery = new GalleryNode()
      galleryNode.insertAfter(newGallery)
      for (const image of imagesAfter) {
        newGallery.append(image)
      }
    }

    // Remove images before cursor if gallery would be at end (offset === childCount means cursor after last)
    // Images before the cursor stay in the original gallery
    // If offset is 0, original gallery is now empty and will be auto-removed (canBeEmpty=false)
    // If offset is childCount, we already moved nothing — but cursor shouldn't be there in normal flow

    // Insert a paragraph between the two galleries (or after the original if no second gallery)
    const paragraph = $createParagraphNode()
    const textNode = $createTextNode(text)
    paragraph.append(textNode)

    if (imagesAfter.length > 0) {
      // Insert paragraph before the new gallery
      const newGallery = galleryNode.getNextSibling()
      newGallery.insertBefore(paragraph)
    } else {
      galleryNode.insertAfter(paragraph)
    }

    paragraph.select(1, 1)
  }

  // Split a gallery on Enter when cursor is between images
  #splitGalleryOnEnter(event) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

    const anchorNode = selection.anchor.getNode()
    if (!(anchorNode instanceof GalleryNode)) return false

    const offset = selection.anchor.offset
    const children = anchorNode.getChildren()
    const imagesAfter = children.slice(offset)

    if (imagesAfter.length > 0) {
      const newGallery = new GalleryNode()
      anchorNode.insertAfter(newGallery)
      for (const image of imagesAfter) {
        newGallery.append(image)
      }
    }

    const paragraph = $createParagraphNode()
    if (imagesAfter.length > 0) {
      const newGallery = anchorNode.getNextSibling()
      newGallery.insertBefore(paragraph)
    } else {
      anchorNode.insertAfter(paragraph)
    }

    paragraph.selectStart()

    event.preventDefault()
    return true
  }

  // Merge the next gallery's images into the previous gallery, removing the next gallery
  #mergeAdjacentGalleries(previousGallery, nextGallery) {
    const children = nextGallery.getChildren()
    for (const child of children) {
      previousGallery.append(child)
    }
    // nextGallery is now empty and canBeEmpty()=false, so it will auto-remove on splice,
    // but since we moved all children manually, we need to remove it explicitly
    nextGallery.remove()
  }

  #deleteSelectedOrNext() {
    const node = this.nodeAfterCursor
    if (node instanceof DecoratorNode) {
      this.#selectInLexical(node)
      return true
    } else {
      this.#contents.deleteSelectedNodes()
    }

    return false
  }

  #deletePreviousOrNext() {
    if (this.#tryMergeAdjacentGalleries()) return true

    const node = this.nodeBeforeCursor
    if (node instanceof DecoratorNode) {
      this.#selectInLexical(node)
      return true
    } else {
      this.#contents.deleteSelectedNodes()
    }

    return false
  }

  // When backspace is pressed in an empty paragraph between two galleries, merge them
  #tryMergeAdjacentGalleries() {
    let merged = false

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return

      const anchorNode = selection.anchor.getNode()
      const offset = selection.anchor.offset

      // Check if we're at offset 0 of a paragraph (or the paragraph itself as element)
      let paragraph = null
      if ($isTextNode(anchorNode) && offset === 0) {
        paragraph = anchorNode.getTopLevelElement()
      } else if ($isElementNode(anchorNode) && offset === 0) {
        paragraph = anchorNode
      }

      if (!paragraph) return

      const prevSibling = paragraph.getPreviousSibling()
      const nextSibling = paragraph.getNextSibling()

      if (prevSibling instanceof GalleryNode && nextSibling instanceof GalleryNode) {
        // Only merge if the paragraph is empty
        if (paragraph.getTextContent().trim() === "") {
          merged = true
        }
      }
    })

    if (merged) {
      this.editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        const anchorNode = selection.anchor.getNode()
        const paragraph = $isTextNode(anchorNode) ? anchorNode.getTopLevelElement() : anchorNode

        const prevGallery = paragraph.getPreviousSibling()
        const nextGallery = paragraph.getNextSibling()

        if (prevGallery instanceof GalleryNode && nextGallery instanceof GalleryNode) {
          // Select the last image in the first gallery before merging
          const lastImage = prevGallery.getLastChild()

          this.#mergeAdjacentGalleries(prevGallery, nextGallery)
          paragraph.remove()

          if (lastImage) {
            const nodeSelection = $createNodeSelection()
            nodeSelection.add(lastImage.getKey())
            $setSelection(nodeSelection)
          }
        }
      })
    }

    return merged
  }

  #getValidSelectionRange() {
    const lexicalSelection = $getSelection()
    if (!lexicalSelection || !lexicalSelection.isCollapsed()) return null

    const nativeSelection = window.getSelection()
    if (!nativeSelection || nativeSelection.rangeCount === 0) return null

    return nativeSelection.getRangeAt(0)
  }

  #getReliableRectFromRange(range) {
    let rect = range.getBoundingClientRect()

    if (this.#isRectUnreliable(rect)) {
      const marker = this.#createAndInsertMarker(range)
      rect = marker.getBoundingClientRect()
      this.#restoreSelectionAfterMarker(marker)
      marker.remove()
    }

    return rect
  }

  #isRectUnreliable(rect) {
    return rect.width === 0 && rect.height === 0 || rect.top === 0 && rect.left === 0
  }

  #createAndInsertMarker(range) {
    const marker = this.#createMarker()
    range.insertNode(marker)
    return marker
  }

  #createMarker() {
    const marker = document.createElement("span")
    marker.textContent = "\u200b"
    marker.style.display = "inline-block"
    marker.style.width = "1px"
    marker.style.height = "1em"
    marker.style.lineHeight = "normal"
    marker.setAttribute("nonce", getNonce())
    return marker
  }

  #restoreSelectionAfterMarker(marker) {
    const nativeSelection = window.getSelection()
    nativeSelection.removeAllRanges()
    const newRange = document.createRange()
    newRange.setStartAfter(marker)
    newRange.collapse(true)
    nativeSelection.addRange(newRange)
  }

  #calculateCursorPosition(rect, range) {
    const rootRect = this.editor.getRootElement().getBoundingClientRect()
    const x = rect.left - rootRect.left
    let y = rect.top - rootRect.top

    const fontSize = this.#getFontSizeForCursor(range)
    if (!isNaN(fontSize)) {
      y += fontSize
    }

    return { x, y, fontSize }
  }

  #getFontSizeForCursor(range) {
    const nativeSelection = window.getSelection()
    const anchorNode = nativeSelection.anchorNode
    const parentElement = this.#getElementFromNode(anchorNode)

    if (parentElement instanceof HTMLElement) {
      const computed = window.getComputedStyle(parentElement)
      return parseFloat(computed.fontSize)
    }

    return 0
  }

  #getElementFromNode(node) {
    return node?.nodeType === Node.TEXT_NODE ? node.parentElement : node
  }

  #getCollapsedSelectionData() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return { anchorNode: null, offset: 0 }
    }

    const { anchor } = selection
    return { anchorNode: anchor.getNode(), offset: anchor.offset }
  }

  #getNodeAfterTextNode(anchorNode, offset) {
    if (offset === anchorNode.getTextContentSize()) {
      return this.#getNextNodeFromTextEnd(anchorNode)
    }
    return null
  }

  #getNextNodeFromTextEnd(anchorNode) {
    if (anchorNode.getNextSibling() instanceof DecoratorNode) {
      return anchorNode.getNextSibling()
    }
    const parent = anchorNode.getParent()
    return parent ? parent.getNextSibling() : null
  }

  #getNodeAfterElementNode(anchorNode, offset) {
    if (offset < anchorNode.getChildrenSize()) {
      return anchorNode.getChildAtIndex(offset)
    }
    return this.#findNextSiblingUp(anchorNode)
  }

  #getNodeBeforeTextNode(anchorNode, offset) {
    if (offset === 0) {
      return this.#getPreviousNodeFromTextStart(anchorNode)
    }
    return null
  }

  #getPreviousNodeFromTextStart(anchorNode) {
    if (anchorNode.getPreviousSibling() instanceof DecoratorNode) {
      return anchorNode.getPreviousSibling()
    }
    const parent = anchorNode.getParent()
    return parent.getPreviousSibling()
  }

  #getNodeBeforeElementNode(anchorNode, offset) {
    if (offset > 0) {
      return anchorNode.getChildAtIndex(offset - 1)
    }
    return this.#findPreviousSiblingUp(anchorNode)
  }

  #findNextSiblingUp(node) {
    let current = node
    while (current && current.getNextSibling() == null) {
      current = current.getParent()
    }
    return current ? current.getNextSibling() : null
  }

  #findPreviousSiblingUp(node) {
    let current = node
    while (current && current.getPreviousSibling() == null) {
      current = current.getParent()
    }
    return current ? current.getPreviousSibling() : null
  }
}
