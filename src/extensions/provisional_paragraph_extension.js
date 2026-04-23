import { $addUpdateTag, $getRoot, $getSelection, $isRootOrShadowRoot, COMMAND_PRIORITY_HIGH, HISTORY_MERGE_TAG, RootNode, SELECTION_CHANGE_COMMAND, defineExtension } from "lexical"
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
          editor.registerCommand(SELECTION_CHANGE_COMMAND, $markAllProvisionalParagraphsDirty, COMMAND_PRIORITY_HIGH)
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

function $markAllProvisionalParagraphsDirty() {
  // Selection-driven visibility updates must not become standalone undo steps.
  $addUpdateTag(HISTORY_MERGE_TAG)

  for (const provisionalParagraph of $getAllProvisionalParagraphs()) {
    provisionalParagraph.markDirty()
  }
}

function $getAllProvisionalParagraphs(rootNode = $getRoot()) {
  return $descendantsMatching(rootNode.getChildren(), $isProvisionalParagraphNode)
}
