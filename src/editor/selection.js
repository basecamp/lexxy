import {
  $createNodeSelection, $isElementNode, $isRangeSelection, $getNodeByKey, $getSelection, $isNodeSelection,
  $setSelection, $getRoot, $isTextNode, $isLineBreakNode, COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND, KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND, KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND, DecoratorNode, $createParagraphNode
} from "lexical"
import { nextFrame } from "../helpers/timing_helpers"
import { getNonce } from "../helpers/csp_helper"
import { getNearestListItemNode } from "../helpers/lexical_helper"

export default class Selection {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = this.editorElement.editor
    this.previouslySelectedKeys = new Set()

    this.#listenForNodeSelections()
    this.#processSelectionChangeCommands()
  }

  clear() {
    this.current = null
  }

  set current(selection) {
    if ($isNodeSelection(selection)) {
      this._current = $getSelection()
      this.#syncSelectedClasses()
    } else {
      this.editor.update(() => {
        this.#syncSelectedClasses()
        this._current = null
      })
    }
  }

  get current() {
    return this._current
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
      $getRoot().selectEnd()
    })
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

  get #contents() {
    return this.editorElement.contents
  }

  get #currentlySelectedKeys() {
    if (this._currentlySelectedKeys) { return this._currentlySelectedKeys }

    this._currentlySelectedKeys = new Set()

    if (this.current) {
      for (const node of this.current.getNodes()) {
        this._currentlySelectedKeys.add(node.getKey())
      }
    }

    return this._currentlySelectedKeys
  }

  #processSelectionChangeCommands() {
    this.editor.registerCommand(KEY_ARROW_LEFT_COMMAND, this.#selectPreviousNode.bind(this), COMMAND_PRIORITY_LOW)
    this.editor.registerCommand(KEY_ARROW_UP_COMMAND, this.#selectPreviousNode.bind(this), COMMAND_PRIORITY_LOW)
    this.editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, this.#selectNextNode.bind(this), COMMAND_PRIORITY_LOW)
    this.editor.registerCommand(KEY_ARROW_DOWN_COMMAND, this.#selectNextNode.bind(this), COMMAND_PRIORITY_LOW)

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

  #syncSelectedClasses() {
    this.#clearPreviouslyHighlightedItems()
    this.#highlightNewItems()

    this.previouslySelectedKeys = this.#currentlySelectedKeys
    this._currentlySelectedKeys = null
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
    if (this.current) {
      await this.#withCurrentNode((currentNode) => currentNode.selectPrevious())
    } else {
      this.#selectInLexical(this.nodeBeforeCursor)
    }
  }

  async #selectNextNode() {
    if (this.current) {
      await this.#withCurrentNode((currentNode) => currentNode.selectNext(0, 0))
    } else {
      this.#selectInLexical(this.nodeAfterCursor)
    }
  }

  async #withCurrentNode(fn) {
    await nextFrame()
    if (this.current) {
      this.editor.update(() => {
        this.clear()
        fn(this.current.getNodes()[0])
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

  #deleteSelectedOrNext() {
    const node = this.nodeAfterCursor
    if (node instanceof DecoratorNode) {
      this.#selectInLexical(node)
    } else {
      this.#contents.deleteSelectedNodes()
    }

    return true
  }

  #deletePreviousOrNext() {
    const node = this.nodeBeforeCursor
    if (node instanceof DecoratorNode) {
      this.#selectInLexical(node)
    } else {
      this.#contents.deleteSelectedNodes()
    }

    return true
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
    return (rect.width === 0 && rect.height === 0) || (rect.top === 0 && rect.left === 0)
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
    let x = rect.left - rootRect.left
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
