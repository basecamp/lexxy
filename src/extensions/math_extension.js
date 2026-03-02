import { $createParagraphNode, $getNodeByKey, $getSelection, $isRangeSelection, $isParagraphNode, $isTextNode, COMMAND_PRIORITY_NORMAL, TextNode, createCommand, defineExtension, KEY_ENTER_COMMAND } from "lexical"
import { mergeRegister } from "@lexical/utils"
import LexxyExtension from "./lexxy_extension"
import { InlineMathNode } from "../nodes/inline_math_node"
import { BlockMathNode } from "../nodes/block_math_node"

export const INSERT_BLOCK_MATH_COMMAND = createCommand()
export const INSERT_INLINE_MATH_COMMAND = createCommand()

const INLINE_MATH_REGEX = /(?<!\$)\$([^$\n]+)\$(?!\$)/

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
          }, COMMAND_PRIORITY_NORMAL),

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
  const matchStart = match.index
  const matchEnd = matchStart + match[0].length

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

  const text = topElement.getTextContent()
  if (text !== "$$") return false

  event.preventDefault()

  const blockMathNode = new BlockMathNode({ latex: "" })
  topElement.replace(blockMathNode)

  // Ensure paragraph below
  editor.update(() => {
    if (!blockMathNode.getNextSibling()) {
      const paragraph = $createParagraphNode()
      blockMathNode.insertAfter(paragraph)
    }
  })

  // Open editor after DOM updates
  requestAnimationFrame(() => {
    openMathEditor(editor, editorElement, blockMathNode.getKey(), "", true)
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
    openMathEditor(editor, editorElement, node.getKey(), "", true)
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
    const { nodeKey, latex, displayMode } = event.detail
    openMathEditor(editor, editorElement, nodeKey, latex, displayMode)
  }

  editorElement.addEventListener("lexxy:edit-math", handler)

  return () => {
    editorElement.removeEventListener("lexxy:edit-math", handler)
  }
}

function openMathEditor(editor, editorElement, nodeKey, latex, displayMode) {
  let mathEditor = editorElement.querySelector("lexxy-math-editor")
  if (!mathEditor) {
    mathEditor = document.createElement("lexxy-math-editor")
    editorElement.appendChild(mathEditor)
  }

  // Find the DOM element for positioning
  const rootElement = editor.getRootElement()
  const targetElement = rootElement?.querySelector(`[data-lexxy-decorator]`)
    ? findDOMNodeForKey(rootElement, nodeKey)
    : null

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

        // Replace with a new node containing updated latex
        if (node instanceof BlockMathNode) {
          const newNode = new BlockMathNode({ latex: newLatex })
          node.replace(newNode)
        } else if (node instanceof InlineMathNode) {
          const newNode = new InlineMathNode({ latex: newLatex })
          node.replace(newNode)
        }
      })

      editor.focus()
    }
  })
}

function findDOMNodeForKey(rootElement, nodeKey) {
  // Lexical decorates DOM elements with data attributes we can search
  return rootElement?.querySelector(`[data-lexical-decorator="true"]`) || null
}
