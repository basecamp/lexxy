import {
  $createParagraphNode, $getNearestNodeFromDOMNode, $getRoot, $getSelection, $isDecoratorNode, $isElementNode,
  $isLineBreakNode, $isNodeSelection, $isRangeSelection, $isTextNode, $setSelection, CLICK_COMMAND, COMMAND_PRIORITY_LOW, DELETE_CHARACTER_COMMAND, DecoratorNode,
  KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_UP_COMMAND, SELECTION_CHANGE_COMMAND, isDOMNode
} from "lexical"
import { $getNearestNodeOfType } from "@lexical/utils"
import { $getListDepth, ListItemNode, ListNode } from "@lexical/list"
import { $getTableCellNodeFromLexicalNode, TableCellNode } from "@lexical/table"
import { CodeNode } from "@lexical/code"
import { nextFrame } from "../helpers/timing_helpers"
import { isSelectionHighlighted } from "../helpers/format_helper"
import { getNonce } from "../helpers/csp_helper"
import { $createNodeSelectionWith, getListType } from "../helpers/lexical_helper"
import { LinkNode } from "@lexical/link"
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"

export default class Selection {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editorContentElement = editorElement.editorContentElement
    this.editor = this.editorElement.editor
    this.previouslySelectedKeys = new Set()

    this.#listenForNodeSelections()
    this.#processSelectionChangeCommands()
    this.#containEditorFocus()
  }

  set current(selection) {
    this.editor.update(() => {
      this.#syncSelectedClasses()
    })
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

    return {
      isBold: selection.hasFormat("bold"),
      isItalic: selection.hasFormat("italic"),
      isStrikethrough: selection.hasFormat("strikethrough"),
      isHighlight: isSelectionHighlighted(selection),
      isInLink: $getNearestNodeOfType(anchorNode, LinkNode) !== null,
      isInQuote: $isQuoteNode(topLevelElement),
      isInHeading: $isHeadingNode(topLevelElement),
      headingTag: $isHeadingNode(topLevelElement)
        ? topLevelElement.getTag()
        : null,
      isInCode: selection.hasFormat("code") || $getNearestNodeOfType(anchorNode, CodeNode) !== null,
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
    return this.nearestNodeOfType(TableCellNode) !== null
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

    this.editor.registerCommand(DELETE_CHARACTER_COMMAND, this.#selectDecoratorNodeBeforeDeletion.bind(this), COMMAND_PRIORITY_LOW)

    this.editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
        this.current = $getSelection()
      }, COMMAND_PRIORITY_LOW)
  }

  #listenForNodeSelections() {
    this.editor.registerCommand(CLICK_COMMAND, ({ target }) => {
        if (!isDOMNode(target)) return false

        const targetNode = $getNearestNodeFromDOMNode(target)
        return $isDecoratorNode(targetNode) && this.#selectInLexical(targetNode)
      }, COMMAND_PRIORITY_LOW)

    this.editor.getRootElement().addEventListener("lexxy:internal:move-to-next-line", (event) => {
        this.#selectOrAppendNextLine()
      })
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
      return await this.#withCurrentNode((currentNode) => currentNode.selectPrevious())
    } else {
      return this.#selectInLexical(this.nodeBeforeCursor)
    }
  }

  async #selectNextNode() {
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
      const selection = $createNodeSelectionWith(node)
      $setSelection(selection)
      return selection
    } else {
      return false
    }
  }

  #selectDecoratorNodeBeforeDeletion(backwards) {
    const node = backwards ? this.nodeBeforeCursor : this.nodeAfterCursor
    if (node instanceof DecoratorNode) {
      this.#selectInLexical(node)

      return true
    } else {
      return false
    }
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
