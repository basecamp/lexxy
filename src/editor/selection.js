import {
  $addUpdateTag, $createParagraphNode, $getNearestNodeFromDOMNode, $getRoot, $getSelection, $isDecoratorNode, $isElementNode,
  $isLineBreakNode, $isNodeSelection, $isRangeSelection, $isTextNode, $setSelection, CLICK_COMMAND, COMMAND_PRIORITY_LOW, DELETE_CHARACTER_COMMAND,
  HISTORY_MERGE_TAG, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_UP_COMMAND, SELECTION_CHANGE_COMMAND, isDOMNode
} from "lexical"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $getListDepth, ListItemNode, ListNode } from "@lexical/list"
import { $getTableCellNodeFromLexicalNode, TableCellNode } from "@lexical/table"
import { CodeNode } from "@lexical/code"
import { nextFrame } from "../helpers/timing_helper"
import { isSelectionHighlighted } from "../helpers/format_helper"
import { getNonce } from "../helpers/csp_helper"
import { $createNodeSelectionWith, $isListItemStructurallyEmpty, getListType } from "../helpers/lexical_helper"
import { LinkNode } from "@lexical/link"
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { $isActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"

export default class Selection {
  #listeners = new ListenerBin()

  constructor(editorElement) {
    this.editorElement = editorElement
    this.editorContentElement = editorElement.editorContentElement
    this.editor = this.editorElement.editor
    this.previouslySelectedKeys = new Set()

    this.#listenForNodeSelections()
    this.#processSelectionChangeCommands()
    this.#containEditorFocus()
    this.#clearStaleInlineCodeFormat()
  }

  get hasNodeSelection() {
    return this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      return selection !== null && $isNodeSelection(selection)
    })
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

  getFormat() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return {}

    const anchorNode = selection.anchor.getNode()
    if (!anchorNode.getParent()) return {}

    const topLevelElement = anchorNode.getTopLevelElementOrThrow()
    const listType = getListType(anchorNode)
    const headingNode = this.#getNearestHeadingNode(anchorNode)

    return {
      isBold: selection.hasFormat("bold"),
      isItalic: selection.hasFormat("italic"),
      isStrikethrough: selection.hasFormat("strikethrough"),
      isUnderline: selection.hasFormat("underline"),
      isHighlight: isSelectionHighlighted(selection),
      isInLink: $getNearestNodeOfType(anchorNode, LinkNode) !== null,
      isInQuote: $isQuoteNode(topLevelElement),
      isInHeading: headingNode !== null,
      isInCode: this.#isInCode(selection, anchorNode),
      headingTag: headingNode?.getTag() ?? null,
      isInList: listType !== null,
      listType,
      isInTable: $getTableCellNodeFromLexicalNode(anchorNode) !== null
    }
  }

  nearestNodeOfType(nodeType) {
    const anchorNode = $getSelection()?.anchor?.getNode()
    return $getNearestNodeOfType(anchorNode, nodeType)
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

    // When anchor and focus are in different block-level children of the same
    // top-level element (e.g. two paragraphs inside a blockquote), this is a
    // multi-line selection, not a single-line one.
    const anchorBlock = $isElementNode(anchorNode) ? anchorNode : anchorNode.getParent()
    const focusBlock = $isElementNode(focusNode) ? focusNode : focusNode.getParent()
    if (anchorBlock !== focusBlock && anchorBlock !== anchorElement) {
      return false
    }

    const nodes = selection.getNodes()
    for (const node of nodes) {
      if ($isLineBreakNode(node)) {
        return false
      }
    }

    return true
  }

  get isInsideList() {
    return this.nearestNodeOfType(ListItemNode)
  }

  get isIndentedList() {
    const closestListNode = this.nearestNodeOfType(ListNode)
    return closestListNode && ($getListDepth(closestListNode) > 1)
  }

  get isInsideCodeBlock() {
    return this.nearestNodeOfType(CodeNode) !== null
  }

  get isTableCellSelected() {
    const selection = $getSelection()
    const { anchor, focus } = selection
    if (!$isRangeSelection(selection) || anchor.key !== focus.key) return false

    return this.nearestNodeOfType(TableCellNode) !== null
  }

  get isOnPreviewableImage() {
    const selection = $getSelection()
    const firstNode = selection?.getNodes().at(0)
    return $isActionTextAttachmentNode(firstNode) && firstNode.isPreviewableImage
  }

  get isAtNodeStart() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData()
    return anchorNode && offset === 0
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
      if (offset === anchorNode.getTextContentSize()) return this.#getNextNodeFromTextEnd(anchorNode)
      if (this.#isCursorOnLastVisualLineOfBlock(anchorNode)) {
        const topLevelElement = anchorNode.getTopLevelElement()
        return topLevelElement ? topLevelElement.getNextSibling() : null
      }
      return null
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
      if (offset === 0) return this.#getPreviousNodeFromTextStart(anchorNode)
      if (this.#isCursorOnFirstVisualLineOfBlock(anchorNode)) {
        const topLevelElement = anchorNode.getTopLevelElement()
        return topLevelElement ? topLevelElement.getPreviousSibling() : null
      }
      return null
    }

    if ($isElementNode(anchorNode)) {
      return this.#getNodeBeforeElementNode(anchorNode, offset)
    }

    return this.#findPreviousSiblingUp(anchorNode)
  }

  dispose() {
    this.editorElement = null
    this.editorContentElement = null
    this.editor = null
    this.previouslySelectedKeys = null

    this.#listeners.dispose()
  }

  // When all inline code text is deleted, Lexical's selection retains the stale
  // code format flag. Verify the flag is backed by actual code-formatted content:
  // a code block ancestor or a text node that carries the code format.
  #isInCode(selection, anchorNode) {
    if ($getNearestNodeOfType(anchorNode, CodeNode) !== null) return true
    if (!selection.hasFormat("code")) return false

    return $isTextNode(anchorNode) && anchorNode.hasFormat("code")
  }

  // After deleting all inline code text, Lexical preserves the code format on
  // the selection even though no code-formatted content remains. This listener
  // detects that stale state and clears it so newly typed text won't be
  // code-formatted.
  #clearStaleInlineCodeFormat() {
    this.#listeners.track(this.editor.registerUpdateListener(({ editorState, tags }) => {
      if (tags.has("history-merge") || tags.has("skip-dom-selection")) return

      let isStale = false

      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return
        if (!selection.hasFormat("code")) return

        const anchorNode = selection.anchor.getNode()
        if (this.#isInCode(selection, anchorNode)) return

        isStale = true
      })

      if (isStale) {
        setTimeout(() => {
          this.editor.update(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection) || !selection.hasFormat("code")) return

            const anchorNode = selection.anchor.getNode()
            if (this.#isInCode(selection, anchorNode)) return

            selection.toggleFormat("code")
          })
        }, 0)
      }
    }))
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
    this.#listeners.track(
      this.editor.registerCommand(KEY_ARROW_LEFT_COMMAND, this.#selectPreviousNode.bind(this), COMMAND_PRIORITY_LOW),
      this.editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, this.#selectNextNode.bind(this), COMMAND_PRIORITY_LOW),
      this.editor.registerCommand(KEY_ARROW_UP_COMMAND, this.#selectPreviousTopLevelNode.bind(this), COMMAND_PRIORITY_LOW),
      this.editor.registerCommand(KEY_ARROW_DOWN_COMMAND, this.#selectNextTopLevelNode.bind(this), COMMAND_PRIORITY_LOW),

      this.editor.registerCommand(DELETE_CHARACTER_COMMAND, this.#selectDecoratorNodeBeforeDeletion.bind(this), COMMAND_PRIORITY_LOW),

      this.editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
        this.#syncSelectedClasses()
      }, COMMAND_PRIORITY_LOW)
    )
  }

  #listenForNodeSelections() {
    this.#listeners.track(this.editor.registerCommand(CLICK_COMMAND, ({ target }) => {
      if (!isDOMNode(target)) return false

      const targetNode = $getNearestNodeFromDOMNode(target)
      return $isDecoratorNode(targetNode) && this.#selectInLexical(targetNode)
    }, COMMAND_PRIORITY_LOW))

    this.#listeners.track(
      registerEventListener(this.editorContentElement, "lexxy:internal:move-to-next-line", () => this.#selectOrAppendNextLine())
    )
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

  async #selectPreviousNode(event) {
    if (event?.shiftKey) return false

    if (this.hasNodeSelection) {
      return await this.#withCurrentNode((currentNode) => currentNode.selectPrevious())
    } else {
      return this.#selectInLexical(this.nodeBeforeCursor)
    }
  }

  async #selectNextNode(event) {
    if (event?.shiftKey) return false

    if (this.hasNodeSelection) {
      return await this.#withCurrentNode((currentNode) => currentNode.selectNext(0, 0))
    } else {
      return this.#selectInLexical(this.nodeAfterCursor)
    }
  }

  async #selectPreviousTopLevelNode() {
    if (this.hasNodeSelection) {
      return await this.#withCurrentNode((currentNode) => currentNode.getTopLevelElement().selectPrevious())
    } else {
      return this.#selectInLexical(this.topLevelNodeBeforeCursor)
    }
  }

  async #selectNextTopLevelNode() {
    if (this.hasNodeSelection) {
      return await this.#withCurrentNode((currentNode) => currentNode.getTopLevelElement().selectNext(0, 0))
    } else {
      return this.#selectInLexical(this.topLevelNodeAfterCursor)
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

  #getNearestHeadingNode(anchorNode) {
    const topLevelElement = anchorNode.getTopLevelElementOrThrow()

    let headingNode = $isHeadingNode(topLevelElement) ? topLevelElement : null
    if (!headingNode) {
      let current = anchorNode.getParent()
      while (current) {
        if ($isHeadingNode(current)) {
          headingNode = current
          break
        }
        current = current.getParent()
      }
    }

    return headingNode
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
    if ($isDecoratorNode(node)) {
      $addUpdateTag(HISTORY_MERGE_TAG)
      const selection = $createNodeSelectionWith(node)
      $setSelection(selection)
      return selection
    } else {
      return false
    }
  }

  #selectDecoratorNodeBeforeDeletion(backwards) {
    if (backwards && this.#removeEmptyListItem()) return true

    const node = backwards ? this.nodeBeforeCursor : this.nodeAfterCursor
    if (!$isDecoratorNode(node)) return false

    if (this.#collapseListItemToParagraph(node)) return true

    this.#removeEmptyElementAnchorNode()

    const selection = this.#selectInLexical(node)
    return Boolean(selection)
  }

  // When backspace is pressed on an empty list item that has siblings,
  // handle the deletion appropriately:
  //
  // - Middle/end items (has previous sibling): remove the empty item and
  //   place the cursor at the end of the previous sibling. Without this,
  //   Lexical's default collapseAtStart converts the empty item into a
  //   paragraph above the list, causing the cursor to jump away.
  //
  // - First item (no previous sibling): convert to a paragraph above the
  //   list, matching the standard "unwrap list formatting" behavior that
  //   users expect from pressing backspace at the start of a list item.
  //
  // When the empty item is the last/only one in the list, we return false
  // and let Lexical's default (convert to paragraph) provide the standard
  // "exit list" behavior.
  #removeEmptyListItem() {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

    const anchorNode = selection.anchor.getNode()
    const listItem = $getNearestNodeOfType(anchorNode, ListItemNode)
    if (!listItem) return false

    if (!$isListItemStructurallyEmpty(listItem)) return false

    const nextSibling = listItem.getNextSibling()
    if (!nextSibling) return false

    const previousSibling = listItem.getPreviousSibling()
    if (previousSibling) {
      previousSibling.selectEnd()
      listItem.remove()
      return true
    }

    const listNode = $getNearestNodeOfType(listItem, ListNode)
    if (!listNode) return false

    const paragraph = $createParagraphNode()
    listNode.insertBefore(paragraph)
    listItem.remove()
    paragraph.selectStart()
    return true
  }

  // When the cursor is inside a list item, collapse the list item into a
  // paragraph instead of selecting the decorator. This lets the user
  // delete a list that immediately follows an attachment without the
  // attachment becoming selected. Only applies when the decorator is
  // outside the list item (e.g. a block attachment before the list),
  // not when it's an inline mention inside the list item.
  #collapseListItemToParagraph(decoratorNode) {
    const anchorNode = $getSelection()?.anchor?.getNode()
    const listItem = anchorNode && $getNearestNodeOfType(anchorNode, ListItemNode)
    if (!listItem) return false

    if (listItem.isParentOf(decoratorNode)) return false

    const listNode = $getNearestNodeOfType(listItem, ListNode)
    if (!listNode) return false

    const paragraph = $createParagraphNode()
    const children = listItem.getChildren()
    children.forEach(child => paragraph.append(child))

    if (listNode.getChildrenSize() === 1) {
      listNode.insertBefore(paragraph)
      listNode.remove()
    } else {
      listNode.insertBefore(paragraph)
      listItem.remove()
    }

    paragraph.selectStart()
    return true
  }

  #removeEmptyElementAnchorNode(anchor = $getSelection()?.anchor) {
    const anchorNode = anchor?.getNode()
    if ($isElementNode(anchorNode) && anchorNode?.isEmpty()) anchorNode.remove()
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
    const nextSibling = anchorNode.getNextSibling()
    if ($isDecoratorNode(nextSibling)) {
      return nextSibling
    }
    if (nextSibling != null) {
      return null
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
    const previousSibling = anchorNode.getPreviousSibling()
    if ($isDecoratorNode(previousSibling)) {
      return previousSibling
    }
    if (previousSibling != null) {
      return null
    }
    const parent = anchorNode.getParent()
    return parent ? parent.getPreviousSibling() : null
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

  #isCursorOnFirstVisualLineOfBlock(anchorNode) {
    return this.#isCursorOnEdgeLineOfBlock(anchorNode, "first")
  }

  #isCursorOnLastVisualLineOfBlock(anchorNode) {
    return this.#isCursorOnEdgeLineOfBlock(anchorNode, "last")
  }

  // Check whether the cursor sits on the first or last visual line of its
  // top-level block by comparing the Y position of the cursor with the Y
  // position of the block's start (first line) or end (last line).
  #isCursorOnEdgeLineOfBlock(anchorNode, edge) {
    const topLevelElement = anchorNode.getTopLevelElement()
    if (!topLevelElement) return false

    const domElement = this.editor.getElementByKey(topLevelElement.getKey())
    if (!domElement) return false

    const nativeSelection = window.getSelection()
    if (!nativeSelection?.rangeCount) return false

    const cursorRect = this.#getReliableRectFromRange(nativeSelection.getRangeAt(0))
    if (!cursorRect || this.#isRectUnreliable(cursorRect)) return false

    const edgeRect = this.#getEdgeCharRect(domElement, edge)
    if (!edgeRect || this.#isRectUnreliable(edgeRect)) return false

    const tolerance = edgeRect.height > 0 ? edgeRect.height * 0.5 : 5
    return Math.abs(cursorRect.top - edgeRect.top) < tolerance
  }

  // Get a reliable bounding rect for the first or last character in a DOM
  // element by creating a non-collapsed range around it.
  #getEdgeCharRect(element, edge) {
    const walker = document.createTreeWalker(element, 4 /* NodeFilter.SHOW_TEXT */)
    let textNode

    if (edge === "first") {
      textNode = walker.nextNode()
    } else {
      while (walker.nextNode()) textNode = walker.currentNode
    }

    if (!textNode || textNode.length === 0) return null

    const range = document.createRange()
    if (edge === "first") {
      range.setStart(textNode, 0)
      range.setEnd(textNode, 1)
    } else {
      range.setStart(textNode, textNode.length - 1)
      range.setEnd(textNode, textNode.length)
    }

    return range.getBoundingClientRect()
  }
}
