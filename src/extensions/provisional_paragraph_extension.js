import { $getRoot, COMMAND_PRIORITY_HIGH, RootNode, SELECTION_CHANGE_COMMAND, defineExtension } from "lexical"
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
  const firstNode = rootNode.getFirstChild()
  if (ProvisionalParagraphNode.neededBetween(null, firstNode)) {
    $insertFirst(rootNode, new ProvisionalParagraphNode)
  }

  for (const node of $firstToLastIterator(rootNode)) {
    const nextNode = node.getNextSibling()
    if (ProvisionalParagraphNode.neededBetween(node, nextNode)) {
      node.insertAfter(new ProvisionalParagraphNode)
    }
  }
}

function $removeUnneededProvisionalParagraphs(rootNode) {
  for (const provisionalParagraph of $getAllProvisionalParagraphs(rootNode)) {
    provisionalParagraph.removeUnlessRequired()
  }
}

function $markAllProvisionalParagraphsDirty() {
  for (const provisionalParagraph of $getAllProvisionalParagraphs()) {
    provisionalParagraph.markDirty()
  }
}

function $getAllProvisionalParagraphs(rootNode = $getRoot()) {
  return $descendantsMatching(rootNode.getChildren(), $isProvisionalParagraphNode)
}
