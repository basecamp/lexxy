import { $createParagraphNode, $getNodeByKey, $getSelection, $getNearestNodeFromDOMNode, $isRangeSelection, $isParagraphNode, CLICK_COMMAND, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_NORMAL, TextNode, createCommand, defineExtension, isDOMNode, KEY_ENTER_COMMAND } from "lexical"
import { mergeRegister } from "@lexical/utils"
import LexxyExtension from "./lexxy_extension"
import { InlineMathNode, $isInlineMathNode } from "../nodes/inline_math_node"
import { BlockMathNode, $isBlockMathNode } from "../nodes/block_math_node"

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
          editor.registerNodeTransform(TextNode, $detectInlineMath),

          editor.registerCommand(KEY_ENTER_COMMAND, (event) => {
            return $handleBlockMathTrigger(editor, editorElement, event)
          }, COMMAND_PRIORITY_HIGH),

          editor.registerCommand(INSERT_BLOCK_MATH_COMMAND, () => {
            $insertBlockMath(editor, editorElement)
            return true
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand(INSERT_INLINE_MATH_COMMAND, () => (
            $insertInlineMath(editor), true
          ), COMMAND_PRIORITY_NORMAL),

          editor.registerCommand(CLICK_COMMAND, ({ target }) => {
            return $handleMathClick(editor, editorElement, target)
          }, COMMAND_PRIORITY_NORMAL),
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

  // Move selection BEFORE replacing to avoid Lexical error #19
  nextParagraph.selectStart()
  topElement.replace(blockMathNode)

  const nodeKey = blockMathNode.getKey()

  requestAnimationFrame(() => {
    const targetElement = editor.getElementByKey(nodeKey)
    openMathEditor(editor, editorElement, nodeKey, "", true, targetElement)
  })

  return true
}

function $handleMathClick(editor, editorElement, target) {
  if (!isDOMNode(target)) return false

  const targetNode = $getNearestNodeFromDOMNode(target)
  if (!targetNode) return false

  if ($isBlockMathNode(targetNode)) {
    const nodeKey = targetNode.getKey()
    const latex = targetNode.getLatex()
    requestAnimationFrame(() => {
      const targetElement = editor.getElementByKey(nodeKey)
      openMathEditor(editor, editorElement, nodeKey, latex, true, targetElement)
    })
    return true
  }

  if ($isInlineMathNode(targetNode)) {
    const nodeKey = targetNode.getKey()
    const latex = targetNode.getLatex()
    requestAnimationFrame(() => {
      const targetElement = editor.getElementByKey(nodeKey)
      openMathEditor(editor, editorElement, nodeKey, latex, false, targetElement)
    })
    return true
  }

  return false
}

function $insertBlockMath(editor, editorElement) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return

  const node = new BlockMathNode({ latex: "" })
  const anchorNode = selection.anchor.getNode()
  const topElement = anchorNode.getTopLevelElementOrThrow()

  if ($isParagraphNode(topElement) && topElement.isEmpty()) {
    topElement.replace(node)
  } else {
    topElement.insertAfter(node)
  }

  if (!node.getNextSibling()) {
    const paragraph = $createParagraphNode()
    node.insertAfter(paragraph)
  }

  requestAnimationFrame(() => {
    const targetElement = editor.getElementByKey(node.getKey())
    openMathEditor(editor, editorElement, node.getKey(), "", true, targetElement)
  })
}

function $insertInlineMath(editor) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return false

  const node = new InlineMathNode({ latex: "" })
  selection.insertNodes([node])
  return true
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
          if ($isBlockMathNode(node)) {
            const paragraph = $createParagraphNode()
            node.replace(paragraph)
            paragraph.selectStart()
          } else {
            node.remove()
          }
          return
        }

        node.setLatex(newLatex)
      })

      editor.focus()
    }
  })
}
