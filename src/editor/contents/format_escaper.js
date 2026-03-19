import { $createParagraphNode, $getSelection, $isLineBreakNode, $isParagraphNode, $isRangeSelection, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_NORMAL, KEY_ARROW_DOWN_COMMAND, KEY_ENTER_COMMAND } from "lexical"
import { $createQuoteNode, $isQuoteNode } from "@lexical/rich-text"
import { EarlyEscapeCodeNode } from "../../nodes/early_escape_code_node"

export default class FormatEscaper {
  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
  }

  monitor() {
    this.editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => this.#handleEnterKey(event),
      COMMAND_PRIORITY_HIGH
    )

    this.editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => this.#handleArrowDownInCodeBlock(event),
      COMMAND_PRIORITY_NORMAL
    )
  }

  #handleEnterKey(event) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false

    const anchorNode = selection.anchor.getNode()

    if (!this.#isInsideBlockquote(anchorNode)) return false

    return this.#handleBlockquotes(event, anchorNode)
  }

  #handleBlockquotes(event, anchorNode) {
    if (this.#shouldEscapeFromEmptyParagraphInBlockquote(anchorNode)) {
      event.preventDefault()
      this.#escapeFromBlockquote(anchorNode)
      return true
    }

    return false
  }

  #shouldEscapeFromEmptyParagraphInBlockquote(node) {
    const paragraph = this.#getParagraphNode(node)
    if (!paragraph) return false

    if (!this.#isNodeEmpty(paragraph)) return false

    const parent = paragraph.getParent()
    return parent && $isQuoteNode(parent)
  }

  #escapeFromBlockquote(anchorNode) {
    const paragraph = this.#getParagraphNode(anchorNode)
    if (!paragraph) return

    const blockquote = paragraph.getParent()
    if (!blockquote || !$isQuoteNode(blockquote)) return

    const siblingsAfter = this.#getSiblingsAfter(paragraph)
    const nonEmptySiblings = siblingsAfter.filter(sibling => !this.#isNodeEmpty(sibling))

    if (nonEmptySiblings.length > 0) {
      this.#splitBlockquote(blockquote, paragraph, nonEmptySiblings)
    } else {
      const newParagraph = $createParagraphNode()
      blockquote.insertAfter(newParagraph)
      paragraph.remove()
      newParagraph.selectStart()
    }
  }

  #splitBlockquote(blockquote, emptyParagraph, siblingsAfter) {
    const newParagraph = $createParagraphNode()
    blockquote.insertAfter(newParagraph)

    const newBlockquote = $createQuoteNode()
    newParagraph.insertAfter(newBlockquote)

    newBlockquote.append(...siblingsAfter)

    emptyParagraph.remove()

    this.#removeTrailingEmptyNodes(blockquote)
    this.#removeTrailingEmptyNodes(newBlockquote)

    newParagraph.selectStart()
  }

  #handleArrowDownInCodeBlock(event) {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

    const codeNode = EarlyEscapeCodeNode.$fromSelection(selection)
    if (!codeNode) return false

    if (codeNode.$isCursorOnLastLine(selection) && !codeNode.getNextSibling()) {
      event?.preventDefault()
      const paragraph = $createParagraphNode()
      codeNode.insertAfter(paragraph)
      paragraph.selectStart()
      return true
    }

    return false
  }

  #isInsideBlockquote(node) {
    let currentNode = node

    while (currentNode) {
      if ($isQuoteNode(currentNode)) {
        return true
      }
      currentNode = currentNode.getParent()
    }

    return false
  }

  #isNodeEmpty(node) {
    if (node.getTextContent().trim() !== "") return false

    const children = node.getChildren()
    if (children.length === 0) return true

    return children.every(child => {
      if ($isLineBreakNode(child)) return true
      return this.#isNodeEmpty(child)
    })
  }

  #getParagraphNode(node) {
    let currentNode = node

    while (currentNode) {
      if ($isParagraphNode(currentNode)) {
        return currentNode
      }
      currentNode = currentNode.getParent()
    }

    return null
  }

  #getSiblingsAfter(node) {
    const siblings = []
    let sibling = node.getNextSibling()

    while (sibling) {
      siblings.push(sibling)
      sibling = sibling.getNextSibling()
    }

    return siblings
  }

  #removeTrailingEmptyNodes(blockquote) {
    const children = blockquote.getChildren()
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i]
      if (this.#isNodeEmpty(child)) {
        child.remove()
      } else {
        break
      }
    }
  }
}
