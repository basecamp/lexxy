import { $getRoot, $getSelection, $isRootOrShadowRoot, RootNode, defineExtension } from "lexical"
import { $descendantsMatching, $firstToLastIterator, $insertFirst, mergeRegister } from "@lexical/utils"
import { $isProvisionalParagraphNode, ProvisionalParagraphNode } from "../nodes/provisional_paragraph_node"
import LexxyExtension from "./lexxy_extension"


export class ProvisionalParagraphExtension extends LexxyExtension {
  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/provisional-paragraph",
      nodes: [
        ProvisionalParagraphNode
      ],
      register(editor) {
        return mergeRegister(
          // Process Provisional Paragraph Nodes on RootNode changes as sibling status influences whether
          // they are required and their visible/hidden status
          editor.registerNodeTransform(RootNode, $insertRequiredProvisionalParagraphs),
          editor.registerNodeTransform(RootNode, $removeUnneededProvisionalParagraphs),
          editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => $syncProvisionalParagraphsVisibility(editor))
          })
        )
      }
    })
  }
}

function $insertRequiredProvisionalParagraphs(rootNode) {
  const nodeBeforeRootSelection = $nodeBeforeRootSelection(rootNode)

  const firstNode = rootNode.getFirstChild()
  if (ProvisionalParagraphNode.neededBetween(null, firstNode)) {
    $insertFirst(rootNode, new ProvisionalParagraphNode)
  }

  for (const node of $firstToLastIterator(rootNode)) {
    const nextNode = node.getNextSibling()
    if (ProvisionalParagraphNode.neededBetween(node, nextNode)) {
      node.insertAfter(new ProvisionalParagraphNode)
      if (node.is(nodeBeforeRootSelection)) node.selectNext()
    }
  }
}

function $nodeBeforeRootSelection(rootNode) {
  const selection = $getSelection()
  if (!$isRootOrShadowRoot(selection?.anchor?.getNode())) return null

  return rootNode.getChildAtIndex(selection.anchor.offset - 1)
}

function $removeUnneededProvisionalParagraphs(rootNode) {
  for (const provisionalParagraph of $getAllProvisionalParagraphs(rootNode)) {
    provisionalParagraph.removeUnlessRequired()
  }
}

// Visibility follows the selection, which can move without any node changing.
// Toggle the class on the committed DOM rather than marking nodes dirty: an edit
// made in response to a selection change joins the update that moved it (Lexical
// 0.52), so it would leak into history or merge with the triggering edit.
function $syncProvisionalParagraphsVisibility(editor) {
  // Only direct root children are kept; nested ones are removed by the transforms
  for (const provisionalParagraph of $getRoot().getChildren().filter($isProvisionalParagraphNode)) {
    const dom = editor.getElementByKey(provisionalParagraph.getKey())
    dom?.classList.toggle("hidden", !provisionalParagraph.isSelected())
  }
}

function $getAllProvisionalParagraphs(rootNode = $getRoot()) {
  return $descendantsMatching(rootNode.getChildren(), $isProvisionalParagraphNode)
}
