import { $createParagraphNode, $createTextNode, $isElementNode, $isLineBreakNode, $isTextNode } from "lexical"
import { $isCodeHighlightNode, $isCodeNode } from "@lexical/code"

// Content loaded into an editor with code blocks or inline code disabled keeps
// its text, but loses the code. This runs on imported nodes before they are
// attached, which covers the initial value; node transforms cover the rest.
export function $filterDisallowedCode(nodes, editorElement) {
  if (!editorElement.supportsRichText) return nodes

  if (!editorElement.supportsCodeBlocks) {
    nodes = nodes.flatMap(node => $isCodeNode(node) ? $convertCodeNodeToParagraphs(node) : node)
    nodes.forEach($replaceNestedCodeNodes)
  }

  if (!editorElement.supportsInlineCode) {
    [ ...nodes, ...$descendantsOf(nodes) ].forEach($removeInlineCodeFormat)
  }

  return nodes
}

export function $replaceCodeNodeWithParagraphs(codeNode) {
  $convertCodeNodeToParagraphs(codeNode).forEach(paragraph => codeNode.insertBefore(paragraph))
  codeNode.remove()
}

export function $removeInlineCodeFormat(node) {
  if ($isTextNode(node) && node.hasFormat("code")) node.toggleFormat("code")
}

// One paragraph per line. Children move across, so links and highlights survive;
// highlight tokens become plain text nodes with the same style. Text inside a
// code block can carry the code format (from <pre><code>), which is dropped.
function $convertCodeNodeToParagraphs(codeNode) {
  const paragraphs = [ $createParagraphNode() ]
  codeNode.getChildren().forEach(child => $appendCodeChild(child, paragraphs))
  $descendantsOf(paragraphs).forEach($removeInlineCodeFormat)
  return paragraphs
}

function $appendCodeChild(node, paragraphs) {
  if ($isLineBreakNode(node)) {
    node.remove()
    paragraphs.push($createParagraphNode())
  } else if ($isCodeNode(node)) {
    node.getChildren().forEach(child => $appendCodeChild(child, paragraphs))
    node.remove()
  } else if ($isCodeHighlightNode(node)) {
    const text = $createTextNode(node.getTextContent()).setFormat(node.getFormat()).setStyle(node.getStyle())
    node.remove()
    paragraphs.at(-1).append(text)
  } else {
    paragraphs.at(-1).append(node)
  }
}

// Only the outermost code node is converted: it takes any code nested inside it along.
function $replaceNestedCodeNodes(node) {
  if (!$isElementNode(node)) return

  for (const child of node.getChildren()) {
    if ($isCodeNode(child)) {
      $replaceCodeNodeWithParagraphs(child)
    } else {
      $replaceNestedCodeNodes(child)
    }
  }
}

function $descendantsOf(nodes) {
  return nodes.flatMap(node => $isElementNode(node) ? [ ...node.getChildren(), ...$descendantsOf(node.getChildren()) ] : [])
}
