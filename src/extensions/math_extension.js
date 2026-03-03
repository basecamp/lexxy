import { $createParagraphNode, $getNodeByKey, $getSelection, $isRangeSelection, $isParagraphNode, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_NORMAL, TextNode, createCommand, defineExtension, KEY_ENTER_COMMAND } from "lexical"
import { mergeRegister } from "@lexical/utils"
import LexxyExtension from "./lexxy_extension"
import { InlineMathNode } from "../nodes/inline_math_node"
import { BlockMathNode } from "../nodes/block_math_node"

export const INSERT_BLOCK_MATH_COMMAND = createCommand()
export const INSERT_INLINE_MATH_COMMAND = createCommand()

export const INLINE_MATH_REGEX = /(?:^|[^$])\$([^$\n]+)\$(?!\$)/

export class MathExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText && this.editorConfig.get("math")
  }

  get lexicalExtension() {
    const editorElement = this.editorElement

    return defineExtension({
      name: "lexxy/math",
      nodes: [InlineMathNode, BlockMathNode],
      register(editor) {
        return mergeRegister(
          // Auto-detect $...$ inline math
          editor.registerNodeTransform(TextNode, (textNode) => {
            $detectInlineMath(textNode)
          }),

          // Block math: detect $$ at start of paragraph + Enter
          editor.registerCommand(KEY_ENTER_COMMAND, (event) => {
            return $handleBlockMathTrigger(editor, editorElement, event)
          }, COMMAND_PRIORITY_HIGH),

          // Command: insert block math
          editor.registerCommand(INSERT_BLOCK_MATH_COMMAND, () => {
            $insertBlockMath(editor, editorElement)
            return true
          }, COMMAND_PRIORITY_NORMAL),

          // Command: insert inline math
          editor.registerCommand(INSERT_INLINE_MATH_COMMAND, () => {
            $insertInlineMath(editor)
            return true
          }, COMMAND_PRIORITY_NORMAL),

          // Listen for edit-math events from nodes
          registerMathEditorListener(editor, editorElement)
        )
      }
    })
  }
}

function $detectInlineMath(textNode) {
  const text = textNode.getTextContent()
  const match = INLINE_MATH_REGEX.exec(text)

  if (!match) return

  const latex = match[1]
  const matchStart = match[0].startsWith("$") ? match.index : match.index + 1
  const matchEnd = match.index + match[0].length

  // Split: [before] [mathNode] [after]
  let nodeToSplit = textNode
  let currentOffset = 0

  if (matchStart > 0) {
    const [before] = nodeToSplit.splitText(matchStart)
    nodeToSplit = before.getNextSibling()
    currentOffset = matchStart
  }

  const mathNode = new InlineMathNode({ latex })

  if (matchEnd < text.length) {
    const splitOffset = matchEnd - currentOffset
    const [mathText] = nodeToSplit.splitText(splitOffset)
    mathText.replace(mathNode)
  } else {
    nodeToSplit.replace(mathNode)
  }
}

function $handleBlockMathTrigger(editor, editorElement, event) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

  const anchorNode = selection.anchor.getNode()
  const topElement = anchorNode.getTopLevelElementOrThrow()

  if (!$isParagraphNode(topElement)) return false

  const text = topElement.getTextContent().trim()
  if (text !== "$$") return false

  event.preventDefault()

  const blockMathNode = new BlockMathNode({ latex: "" })

  // Ensure paragraph below before replacing, so selection can move there
  let nextParagraph = topElement.getNextSibling()
  if (!nextParagraph || !$isParagraphNode(nextParagraph)) {
    nextParagraph = $createParagraphNode()
    topElement.insertAfter(nextParagraph)
  }

  // Move selection to the next paragraph BEFORE replacing
  nextParagraph.selectStart()

  // Now safe to replace — selection no longer references the removed paragraph
  topElement.replace(blockMathNode)

  const nodeKey = blockMathNode.getKey()

  // Open editor after DOM updates
  requestAnimationFrame(() => {
    const targetElement = editor.getElementByKey(nodeKey)
    openMathEditor(editor, editorElement, nodeKey, "", true, targetElement)
  })

  return true
}

function $insertBlockMath(editor, editorElement) {
  const node = new BlockMathNode({ latex: "" })

  const selection = $getSelection()
  if ($isRangeSelection(selection)) {
    const anchorNode = selection.anchor.getNode()
    const topElement = anchorNode.getTopLevelElementOrThrow()

    // If current line is empty paragraph, replace it
    if ($isParagraphNode(topElement) && topElement.getTextContent() === "") {
      topElement.replace(node)
    } else {
      topElement.insertAfter(node)
    }

    // Ensure paragraph below
    if (!node.getNextSibling()) {
      const paragraph = $createParagraphNode()
      node.insertAfter(paragraph)
    }
  }

  requestAnimationFrame(() => {
    const targetElement = editor.getElementByKey(node.getKey())
    openMathEditor(editor, editorElement, node.getKey(), "", true, targetElement)
  })
}

function $insertInlineMath(editor) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return

  const node = new InlineMathNode({ latex: "" })
  selection.insertNodes([node])
}

function registerMathEditorListener(editor, editorElement) {
  const handler = (event) => {
    const { nodeKey, latex, displayMode, targetElement } = event.detail
    openMathEditor(editor, editorElement, nodeKey, latex, displayMode, targetElement)
  }

  editorElement.addEventListener("lexxy:edit-math", handler)

  return () => {
    editorElement.removeEventListener("lexxy:edit-math", handler)
  }
}

function openMathEditor(editor, editorElement, nodeKey, latex, displayMode, targetElement) {
  let mathEditor = editorElement.querySelector("lexxy-math-editor")
  if (!mathEditor) {
    mathEditor = document.createElement("lexxy-math-editor")
    editorElement.appendChild(mathEditor)
  }

  mathEditor.show(latex, targetElement, {
    displayMode,
    callback: (newLatex) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (!node) return

        if (!newLatex) {
          // Empty math — remove the node
          if (node instanceof BlockMathNode) {
            const paragraph = $createParagraphNode()
            node.replace(paragraph)
            paragraph.selectStart()
          } else {
            node.remove()
          }
          return
        }

        if (node instanceof BlockMathNode) {
          const newNode = new BlockMathNode({ latex: newLatex })
          node.insertAfter(newNode)
          node.remove()
        } else if (node instanceof InlineMathNode) {
          const newNode = new InlineMathNode({ latex: newLatex })
          node.insertAfter(newNode)
          node.remove()
        }
      })

      editor.focus()
    }
  })
}
